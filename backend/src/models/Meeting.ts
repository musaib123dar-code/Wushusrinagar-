import { v4 as uuidv4 } from 'uuid';
import { db } from '../../config/db';
import { 
  Meeting, 
  CreateMeetingRequest, 
  MeetingStatus,
  ParticipantRole,
  MeetingParticipant 
} from '../../../shared/types';

export class MeetingModel {
  /**
   * Create a new meeting
   */
  static async create(hostId: string, meetingData: CreateMeetingRequest): Promise<Meeting> {
    const {
      title,
      description,
      isPrivate,
      password,
      maxParticipants,
      startTime,
      duration,
      recordingEnabled = false,
      chatEnabled = true,
      screenShareEnabled = true
    } = meetingData;

    // Create meeting
    const [meetingId] = await db('meetings').insert({
      id: uuidv4(),
      title,
      description,
      host_id: hostId,
      is_private: isPrivate,
      password,
      max_participants: maxParticipants,
      start_time: startTime,
      duration,
      recording_enabled: recordingEnabled,
      chat_enabled: chatEnabled,
      screen_share_enabled: screenShareEnabled,
      status: MeetingStatus.SCHEDULED,
      created_at: new Date(),
      updated_at: new Date()
    }).returning('id');

    // Add host as participant
    await db('meeting_participants').insert({
      id: uuidv4(),
      meeting_id: meetingId,
      user_id: hostId,
      role: ParticipantRole.HOST,
      is_host: true,
      joined_at: new Date()
    });

    // Create meeting settings
    await db('meeting_settings').insert({
      id: uuidv4(),
      meeting_id: meetingId,
      recording_enabled: recordingEnabled,
      chat_enabled: chatEnabled,
      screen_share_enabled: screenShareEnabled,
      participant_video_enabled: true,
      participant_audio_enabled: true,
      created_at: new Date(),
      updated_at: new Date()
    });

    return this.findById(meetingId);
  }

  /**
   * Find meeting by ID
   */
  static async findById(id: string): Promise<Meeting | null> {
    const meeting = await db('meetings as m')
      .select(
        'm.*',
        'u.id as host_id',
        'u.email as host_email',
        'u.username as host_username',
        'u.first_name as host_first_name',
        'u.last_name as host_last_name',
        'u.avatar as host_avatar'
      )
      .join('users as u', 'm.host_id', 'u.id')
      .where('m.id', id)
      .first();

    if (!meeting) return null;

    return this.mapDatabaseToMeeting(meeting);
  }

  /**
   * Find meetings by host
   */
  static async findByHost(hostId: string, limit: number = 10, offset: number = 0): Promise<Meeting[]> {
    const meetings = await db('meetings as m')
      .select(
        'm.*',
        'u.id as host_id',
        'u.email as host_email',
        'u.username as host_username',
        'u.first_name as host_first_name',
        'u.last_name as host_last_name',
        'u.avatar as host_avatar'
      )
      .join('users as u', 'm.host_id', 'u.id')
      .where('m.host_id', hostId)
      .orderBy('m.start_time', 'desc')
      .limit(limit)
      .offset(offset);

    return meetings.map(this.mapDatabaseToMeeting);
  }

  /**
   * Find upcoming meetings for user
   */
  static async findUpcomingByUser(userId: string, limit: number = 10): Promise<Meeting[]> {
    const meetings = await db('meetings as m')
      .select(
        'm.*',
        'u.id as host_id',
        'u.email as host_email',
        'u.username as host_username',
        'u.first_name as host_first_name',
        'u.last_name as host_last_name',
        'u.avatar as host_avatar'
      )
      .join('users as u', 'm.host_id', 'u.id')
      .join('meeting_participants as mp', function() {
        this.on('m.id', '=', 'mp.meeting_id').andOn('mp.user_id', '=', db.raw('?', [userId]));
      })
      .where('m.start_time', '>', new Date())
      .whereIn('m.status', [MeetingStatus.SCHEDULED, MeetingStatus.LIVE])
      .orderBy('m.start_time', 'asc')
      .limit(limit);

    return meetings.map(this.mapDatabaseToMeeting);
  }

  /**
   * Join a meeting
   */
  static async joinMeeting(meetingId: string, userId: string): Promise<MeetingParticipant> {
    // Check if meeting exists and has space
    const meeting = await this.findById(meetingId);
    if (!meeting) {
      throw new Error('Meeting not found');
    }

    const participantCount = await db('meeting_participants')
      .where('meeting_id', meetingId)
      .whereNull('left_at')
      .count('* as count')
      .first();

    const currentParticipants = parseInt(participantCount?.count as string || '0');
    if (currentParticipants >= meeting.maxParticipants) {
      throw new Error('Meeting is full');
    }

    // Check if user is already a participant
    const existingParticipant = await db('meeting_participants')
      .where('meeting_id', meetingId)
      .where('user_id', userId)
      .first();

    if (existingParticipant) {
      // Update existing participant
      await db('meeting_participants')
        .where('id', existingParticipant.id)
        .update({
          left_at: null,
          joined_at: new Date()
        });

      return this.getParticipant(existingParticipant.id);
    }

    // Add new participant
    const [participantId] = await db('meeting_participants').insert({
      id: uuidv4(),
      meeting_id: meetingId,
      user_id: userId,
      role: ParticipantRole.PARTICIPANT,
      is_host: meeting.hostId === userId,
      joined_at: new Date()
    }).returning('id');

    return this.getParticipant(participantId);
  }

  /**
   * Leave a meeting
   */
  static async leaveMeeting(meetingId: string, userId: string): Promise<boolean> {
    const updated = await db('meeting_participants')
      .where('meeting_id', meetingId)
      .where('user_id', userId)
      .whereNull('left_at')
      .update({
        left_at: new Date()
      });

    return updated > 0;
  }

  /**
   * Get meeting participants
   */
  static async getParticipants(meetingId: string): Promise<MeetingParticipant[]> {
    const participants = await db('meeting_participants as mp')
      .select(
        'mp.*',
        'u.id as user_id',
        'u.email',
        'u.username',
        'u.first_name',
        'u.last_name',
        'u.avatar',
        'u.is_online'
      )
      .join('users as u', 'mp.user_id', 'u.id')
      .where('mp.meeting_id', meetingId)
      .whereNull('mp.left_at')
      .orderBy('mp.joined_at', 'asc');

    return participants.map(this.mapDatabaseToParticipant);
  }

  /**
   * Update meeting status
   */
  static async updateStatus(meetingId: string, status: MeetingStatus): Promise<boolean> {
    const updated = await db('meetings')
      .where('id', meetingId)
      .update({
        status,
        updated_at: new Date()
      });

    return updated > 0;
  }

  /**
   * Start meeting (change status to live)
   */
  static async startMeeting(meetingId: string, userId: string): Promise<boolean> {
    // Check if user is host
    const meeting = await this.findById(meetingId);
    if (!meeting || meeting.hostId !== userId) {
      throw new Error('Only the host can start the meeting');
    }

    return this.updateStatus(meetingId, MeetingStatus.LIVE);
  }

  /**
   * End meeting (change status to ended)
   */
  static async endMeeting(meetingId: string, userId: string): Promise<boolean> {
    // Check if user is host
    const meeting = await this.findById(meetingId);
    if (!meeting || meeting.hostId !== userId) {
      throw new Error('Only the host can end the meeting');
    }

    // Update all participants to have left
    await db('meeting_participants')
      .where('meeting_id', meetingId)
      .whereNull('left_at')
      .update({
        left_at: new Date()
      });

    return this.updateStatus(meetingId, MeetingStatus.ENDED);
  }

  /**
   * Cancel meeting
   */
  static async cancelMeeting(meetingId: string, userId: string): Promise<boolean> {
    // Check if user is host
    const meeting = await this.findById(meetingId);
    if (!meeting || meeting.hostId !== userId) {
      throw new Error('Only the host can cancel the meeting');
    }

    return this.updateStatus(meetingId, MeetingStatus.CANCELLED);
  }

  /**
   * Update participant media state
   */
  static async updateParticipantMediaState(
    meetingId: string,
    userId: string,
    mediaState: {
      isMuted?: boolean;
      isVideoEnabled?: boolean;
      isScreenSharing?: boolean;
    }
  ): Promise<boolean> {
    const updates: any = { updated_at: new Date() };
    if (mediaState.isMuted !== undefined) updates.is_muted = mediaState.isMuted;
    if (mediaState.isVideoEnabled !== undefined) updates.is_video_enabled = mediaState.isVideoEnabled;
    if (mediaState.isScreenSharing !== undefined) updates.is_screen_sharing = mediaState.isScreenSharing;

    const updated = await db('meeting_participants')
      .where('meeting_id', meetingId)
      .where('user_id', userId)
      .whereNull('left_at')
      .update(updates);

    return updated > 0;
  }

  /**
   * Delete meeting (only host can delete)
   */
  static async deleteMeeting(meetingId: string, userId: string): Promise<boolean> {
    // Check if user is host
    const meeting = await this.findById(meetingId);
    if (!meeting || meeting.hostId !== userId) {
      throw new Error('Only the host can delete the meeting');
    }

    // Delete meeting (cascade will handle related records)
    const deleted = await db('meetings')
      .where('id', meetingId)
      .delete();

    return deleted > 0;
  }

  /**
   * Get participant by ID
   */
  static async getParticipant(participantId: string): Promise<MeetingParticipant> {
    const participant = await db('meeting_participants as mp')
      .select(
        'mp.*',
        'u.id as user_id',
        'u.email',
        'u.username',
        'u.first_name',
        'u.last_name',
        'u.avatar',
        'u.is_online'
      )
      .join('users as u', 'mp.user_id', 'u.id')
      .where('mp.id', participantId)
      .first();

    if (!participant) {
      throw new Error('Participant not found');
    }

    return this.mapDatabaseToParticipant(participant);
  }

  /**
   * Map database meeting to API meeting
   */
  private static mapDatabaseToMeeting(dbMeeting: any): Meeting {
    return {
      id: dbMeeting.id,
      title: dbMeeting.title,
      description: dbMeeting.description,
      hostId: dbMeeting.host_id,
      host: {
        id: dbMeeting.host_id,
        email: dbMeeting.host_email,
        username: dbMeeting.host_username,
        firstName: dbMeeting.host_first_name,
        lastName: dbMeeting.host_last_name,
        avatar: dbMeeting.host_avatar,
        isOnline: false, // Will be updated in real-time
        lastSeen: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      isPrivate: dbMeeting.is_private,
      password: dbMeeting.password,
      maxParticipants: dbMeeting.max_participants,
      startTime: new Date(dbMeeting.start_time),
      endTime: dbMeeting.end_time ? new Date(dbMeeting.end_time) : undefined,
      duration: dbMeeting.duration,
      status: dbMeeting.status as MeetingStatus,
      recordingEnabled: dbMeeting.recording_enabled,
      chatEnabled: dbMeeting.chat_enabled,
      screenShareEnabled: dbMeeting.screen_share_enabled,
      createdAt: new Date(dbMeeting.created_at),
      updatedAt: new Date(dbMeeting.updated_at)
    };
  }

  /**
   * Map database participant to API participant
   */
  private static mapDatabaseToParticipant(dbParticipant: any): MeetingParticipant {
    return {
      id: dbParticipant.id,
      meetingId: dbParticipant.meeting_id,
      userId: dbParticipant.user_id,
      user: {
        id: dbParticipant.user_id,
        email: dbParticipant.email,
        username: dbParticipant.username,
        firstName: dbParticipant.first_name,
        lastName: dbParticipant.last_name,
        avatar: dbParticipant.avatar,
        isOnline: dbParticipant.is_online,
        lastSeen: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      role: dbParticipant.role as ParticipantRole,
      joinedAt: new Date(dbParticipant.joined_at),
      leftAt: dbParticipant.left_at ? new Date(dbParticipant.left_at) : undefined,
      isMuted: dbParticipant.is_muted,
      isVideoEnabled: dbParticipant.is_video_enabled,
      isScreenSharing: dbParticipant.is_screen_sharing,
      isHost: dbParticipant.is_host
    };
  }
}