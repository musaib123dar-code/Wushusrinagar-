import { pool } from '../config/database.js';
import { Meeting, MeetingStatus, MeetingSettings } from '../../../shared/types/index.js';
import { v4 as uuidv4 } from 'uuid';

export class MeetingModel {
  static generateMeetingCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 10; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  static async create(meetingData: {
    title: string;
    description?: string;
    hostId: string;
    scheduledStartTime?: Date;
    scheduledEndTime?: Date;
    password?: string;
    maxParticipants?: number;
    settings?: MeetingSettings;
  }): Promise<Meeting> {
    const meetingCode = this.generateMeetingCode();
    const settings = meetingData.settings || {
      allowScreenShare: true,
      allowChat: true,
      allowRecording: true,
      muteOnEntry: false,
      waitingRoom: false,
      requirePassword: false
    };

    const result = await pool.query(
      `INSERT INTO meetings (
        title, description, host_id, meeting_code, password,
        scheduled_start_time, scheduled_end_time, max_participants, settings
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, title, description, host_id as "hostId", meeting_code as "meetingCode",
                password, scheduled_start_time as "scheduledStartTime", 
                scheduled_end_time as "scheduledEndTime",
                actual_start_time as "actualStartTime", actual_end_time as "actualEndTime",
                status, is_recording as "isRecording", max_participants as "maxParticipants",
                settings, created_at as "createdAt", updated_at as "updatedAt"`,
      [
        meetingData.title,
        meetingData.description,
        meetingData.hostId,
        meetingCode,
        meetingData.password,
        meetingData.scheduledStartTime,
        meetingData.scheduledEndTime,
        meetingData.maxParticipants || 100,
        JSON.stringify(settings)
      ]
    );

    return result.rows[0];
  }

  static async findById(id: string): Promise<Meeting | null> {
    const result = await pool.query(
      `SELECT id, title, description, host_id as "hostId", meeting_code as "meetingCode",
              password, scheduled_start_time as "scheduledStartTime", 
              scheduled_end_time as "scheduledEndTime",
              actual_start_time as "actualStartTime", actual_end_time as "actualEndTime",
              status, is_recording as "isRecording", max_participants as "maxParticipants",
              settings, created_at as "createdAt", updated_at as "updatedAt"
       FROM meetings WHERE id = $1`,
      [id]
    );

    return result.rows[0] || null;
  }

  static async findByCode(meetingCode: string): Promise<Meeting | null> {
    const result = await pool.query(
      `SELECT id, title, description, host_id as "hostId", meeting_code as "meetingCode",
              password, scheduled_start_time as "scheduledStartTime", 
              scheduled_end_time as "scheduledEndTime",
              actual_start_time as "actualStartTime", actual_end_time as "actualEndTime",
              status, is_recording as "isRecording", max_participants as "maxParticipants",
              settings, created_at as "createdAt", updated_at as "updatedAt"
       FROM meetings WHERE meeting_code = $1`,
      [meetingCode]
    );

    return result.rows[0] || null;
  }

  static async updateStatus(id: string, status: MeetingStatus): Promise<Meeting | null> {
    const updates: any = { status };
    
    if (status === MeetingStatus.LIVE) {
      updates.actualStartTime = new Date();
    } else if (status === MeetingStatus.ENDED) {
      updates.actualEndTime = new Date();
    }

    const fields = ['status = $1'];
    const values = [status];
    let paramCount = 2;

    if (updates.actualStartTime) {
      fields.push(`actual_start_time = $${paramCount++}`);
      values.push(updates.actualStartTime);
    }
    if (updates.actualEndTime) {
      fields.push(`actual_end_time = $${paramCount++}`);
      values.push(updates.actualEndTime);
    }

    values.push(id);

    const result = await pool.query(
      `UPDATE meetings SET ${fields.join(', ')}
       WHERE id = $${paramCount}
       RETURNING id, title, description, host_id as "hostId", meeting_code as "meetingCode",
                 password, scheduled_start_time as "scheduledStartTime", 
                 scheduled_end_time as "scheduledEndTime",
                 actual_start_time as "actualStartTime", actual_end_time as "actualEndTime",
                 status, is_recording as "isRecording", max_participants as "maxParticipants",
                 settings, created_at as "createdAt", updated_at as "updatedAt"`,
      values
    );

    return result.rows[0] || null;
  }

  static async setRecordingStatus(id: string, isRecording: boolean): Promise<void> {
    await pool.query(
      'UPDATE meetings SET is_recording = $1 WHERE id = $2',
      [isRecording, id]
    );
  }

  static async listByHost(hostId: string, limit: number = 50, offset: number = 0) {
    const [meetingsResult, countResult] = await Promise.all([
      pool.query(
        `SELECT id, title, description, host_id as "hostId", meeting_code as "meetingCode",
                scheduled_start_time as "scheduledStartTime", 
                scheduled_end_time as "scheduledEndTime",
                actual_start_time as "actualStartTime", actual_end_time as "actualEndTime",
                status, is_recording as "isRecording", max_participants as "maxParticipants",
                settings, created_at as "createdAt", updated_at as "updatedAt"
         FROM meetings WHERE host_id = $1
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [hostId, limit, offset]
      ),
      pool.query('SELECT COUNT(*) FROM meetings WHERE host_id = $1', [hostId])
    ]);

    return {
      meetings: meetingsResult.rows,
      total: parseInt(countResult.rows[0].count)
    };
  }

  static async listUpcoming(limit: number = 50): Promise<Meeting[]> {
    const result = await pool.query(
      `SELECT id, title, description, host_id as "hostId", meeting_code as "meetingCode",
              scheduled_start_time as "scheduledStartTime", 
              scheduled_end_time as "scheduledEndTime",
              actual_start_time as "actualStartTime", actual_end_time as "actualEndTime",
              status, is_recording as "isRecording", max_participants as "maxParticipants",
              settings, created_at as "createdAt", updated_at as "updatedAt"
       FROM meetings 
       WHERE status = 'scheduled' AND scheduled_start_time > NOW()
       ORDER BY scheduled_start_time ASC
       LIMIT $1`,
      [limit]
    );

    return result.rows;
  }

  static async delete(id: string): Promise<void> {
    await pool.query('DELETE FROM meetings WHERE id = $1', [id]);
  }
}
