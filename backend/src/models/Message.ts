import { v4 as uuidv4 } from 'uuid';
import { db } from '../../config/db';
import { Message, MessageType, SendMessageRequest } from '../../../shared/types';

export class MessageModel {
  /**
   * Send a message in a meeting
   */
  static async sendMessage(messageData: SendMessageRequest, senderId: string): Promise<Message> {
    const { meetingId, content, type = MessageType.TEXT, replyToId, mentions } = messageData;

    // Verify meeting exists and user is participant
    const isParticipant = await this.verifyParticipant(meetingId, senderId);
    if (!isParticipant) {
      throw new Error('User is not a participant of this meeting');
    }

    // Insert message
    const [messageId] = await db('messages').insert({
      id: uuidv4(),
      meeting_id: meetingId,
      sender_id: senderId,
      content,
      type,
      reply_to_id: replyToId,
      timestamp: new Date()
    }).returning('id');

    // Handle mentions
    if (mentions && mentions.length > 0) {
      const mentionRecords = mentions.map(userId => ({
        id: uuidv4(),
        message_id: messageId,
        user_id: userId
      }));

      await db('message_mentions').insert(mentionRecords);
    }

    return this.findById(messageId);
  }

  /**
   * Find message by ID
   */
  static async findById(id: string): Promise<Message | null> {
    const message = await db('messages as m')
      .select(
        'm.*',
        'u.id as sender_id',
        'u.email',
        'u.username',
        'u.first_name',
        'u.last_name',
        'u.avatar'
      )
      .join('users as u', 'm.sender_id', 'u.id')
      .where('m.id', id)
      .first();

    if (!message) return null;

    return this.mapDatabaseToMessage(message);
  }

  /**
   * Get messages for a meeting
   */
  static async getMeetingMessages(
    meetingId: string, 
    limit: number = 50, 
    offset: number = 0,
    before?: string
  ): Promise<Message[]> {
    let query = db('messages as m')
      .select(
        'm.*',
        'u.id as sender_id',
        'u.email',
        'u.username',
        'u.first_name',
        'u.last_name',
        'u.avatar'
      )
      .join('users as u', 'm.sender_id', 'u.id')
      .where('m.meeting_id', meetingId)
      .orderBy('m.timestamp', 'desc')
      .limit(limit)
      .offset(offset);

    // If before parameter is provided, get messages before that message
    if (before) {
      const beforeMessage = await this.findById(before);
      if (beforeMessage) {
        query = query.where('m.timestamp', '<', beforeMessage.timestamp);
      }
    }

    const messages = await query;
    return messages.reverse().map(this.mapDatabaseToMessage); // Reverse to get chronological order
  }

  /**
   * Edit a message
   */
  static async editMessage(messageId: string, userId: string, newContent: string): Promise<Message | null> {
    // Verify user owns the message
    const message = await db('messages')
      .where('id', messageId)
      .where('sender_id', userId)
      .first();

    if (!message) {
      throw new Error('Message not found or user does not have permission to edit');
    }

    // Update message
    await db('messages')
      .where('id', messageId)
      .update({
        content: newContent,
        edited_at: new Date()
      });

    return this.findById(messageId);
  }

  /**
   * Delete a message
   */
  static async deleteMessage(messageId: string, userId: string): Promise<boolean> {
    // Verify user owns the message
    const message = await db('messages')
      .select('sender_id')
      .where('id', messageId)
      .first();

    if (!message || message.sender_id !== userId) {
      throw new Error('Message not found or user does not have permission to delete');
    }

    // Delete message mentions first
    await db('message_mentions')
      .where('message_id', messageId)
      .delete();

    // Delete message
    const deleted = await db('messages')
      .where('id', messageId)
      .delete();

    return deleted > 0;
  }

  /**
   * Mark message as read
   */
  static async markAsRead(messageId: string, userId: string): Promise<void> {
    // This could be used for read receipts in the future
    // For now, we'll just verify the user is a participant
    const message = await db('messages as m')
      .join('meeting_participants as mp', 'm.meeting_id', 'mp.meeting_id')
      .where('m.id', messageId)
      .where('mp.user_id', userId)
      .whereNull('mp.left_at')
      .first();

    if (!message) {
      throw new Error('User is not a participant of this meeting');
    }
  }

  /**
   * Search messages in a meeting
   */
  static async searchMessages(meetingId: string, query: string, limit: number = 20): Promise<Message[]> {
    const messages = await db('messages as m')
      .select(
        'm.*',
        'u.id as sender_id',
        'u.email',
        'u.username',
        'u.first_name',
        'u.last_name',
        'u.avatar'
      )
      .join('users as u', 'm.sender_id', 'u.id')
      .where('m.meeting_id', meetingId)
      .where('m.content', 'ilike', `%${query}%`)
      .orderBy('m.timestamp', 'desc')
      .limit(limit);

    return messages.reverse().map(this.mapDatabaseToMessage);
  }

  /**
   * Get message mentions for a user
   */
  static async getMentions(userId: string, limit: number = 20, offset: number = 0): Promise<Message[]> {
    const messages = await db('message_mentions as mm')
      .select(
        'm.*',
        'u.id as sender_id',
        'u.email',
        'u.username',
        'u.first_name',
        'u.last_name',
        'u.avatar'
      )
      .join('messages as m', 'mm.message_id', 'm.id')
      .join('users as u', 'm.sender_id', 'u.id')
      .where('mm.user_id', userId)
      .orderBy('m.timestamp', 'desc')
      .limit(limit)
      .offset(offset);

    return messages.reverse().map(this.mapDatabaseToMessage);
  }

  /**
   * Get message statistics for a meeting
   */
  static async getMessageStats(meetingId: string): Promise<{
    totalMessages: number;
    messagesByType: Record<MessageType, number>;
    messagesByUser: Array<{ userId: string; username: string; count: number }>;
    recentActivity: Date;
  }> {
    // Total messages
    const totalResult = await db('messages')
      .where('meeting_id', meetingId)
      .count('* as count')
      .first();
    const totalMessages = parseInt(totalResult?.count as string || '0');

    // Messages by type
    const typeStats = await db('messages')
      .select('type')
      .count('* as count')
      .where('meeting_id', meetingId)
      .groupBy('type');

    const messagesByType: Record<MessageType, number> = {
      [MessageType.TEXT]: 0,
      [MessageType.EMOJI]: 0,
      [MessageType.SYSTEM]: 0,
      [MessageType.FILE]: 0,
      [MessageType.IMAGE]: 0
    };

    typeStats.forEach(stat => {
      messagesByType[stat.type as MessageType] = parseInt(stat.count as string);
    });

    // Messages by user
    const userStats = await db('messages as m')
      .select(
        'u.id as user_id',
        'u.username',
        db.raw('COUNT(*) as count')
      )
      .join('users as u', 'm.sender_id', 'u.id')
      .where('m.meeting_id', meetingId)
      .groupBy('u.id', 'u.username')
      .orderBy('count', 'desc');

    const messagesByUser = userStats.map(stat => ({
      userId: stat.user_id,
      username: stat.username,
      count: parseInt(stat.count as string)
    }));

    // Recent activity
    const recentMessage = await db('messages')
      .select('timestamp')
      .where('meeting_id', meetingId)
      .orderBy('timestamp', 'desc')
      .first();

    const recentActivity = recentMessage ? new Date(recentMessage.timestamp) : new Date();

    return {
      totalMessages,
      messagesByType,
      messagesByUser,
      recentActivity
    };
  }

  /**
   * Verify if user is a participant of the meeting
   */
  private static async verifyParticipant(meetingId: string, userId: string): Promise<boolean> {
    const participant = await db('meeting_participants')
      .where('meeting_id', meetingId)
      .where('user_id', userId)
      .whereNull('left_at')
      .first();

    return !!participant;
  }

  /**
   * Map database message to API message
   */
  private static mapDatabaseToMessage(dbMessage: any): Message {
    return {
      id: dbMessage.id,
      meetingId: dbMessage.meeting_id,
      senderId: dbMessage.sender_id,
      sender: {
        id: dbMessage.sender_id,
        email: dbMessage.email,
        username: dbMessage.username,
        firstName: dbMessage.first_name,
        lastName: dbMessage.last_name,
        avatar: dbMessage.avatar,
        isOnline: false, // Will be updated in real-time
        lastSeen: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      content: dbMessage.content,
      type: dbMessage.type as MessageType,
      timestamp: new Date(dbMessage.timestamp),
      editedAt: dbMessage.edited_at ? new Date(dbMessage.edited_at) : undefined,
      replyToId: dbMessage.reply_to_id,
      mentions: [] // Will be populated if needed
    };
  }
}