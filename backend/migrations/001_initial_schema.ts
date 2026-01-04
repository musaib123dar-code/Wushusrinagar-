import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Users table
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('email', 255).unique().notNullable();
    table.string('username', 100).unique().notNullable();
    table.string('first_name', 100).notNullable();
    table.string('last_name', 100).notNullable();
    table.string('password_hash', 255).notNullable();
    table.string('avatar', 500);
    table.boolean('is_online').defaultTo(false);
    table.timestamp('last_seen').defaultTo(knex.fn.now());
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    table.index(['email']);
    table.index(['username']);
    table.index(['is_online']);
  });

  // Refresh tokens table
  await knex.schema.createTable('refresh_tokens', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('token', 500).unique().notNullable();
    table.timestamp('expires_at').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    table.index(['user_id']);
    table.index(['token']);
  });

  // Meetings table
  await knex.schema.createTable('meetings', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('title', 255).notNullable();
    table.text('description');
    table.uuid('host_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.boolean('is_private').defaultTo(false);
    table.string('password', 255);
    table.integer('max_participants').defaultTo(100);
    table.timestamp('start_time').notNullable();
    table.timestamp('end_time');
    table.integer('duration'); // in minutes
    table.enum('status', ['scheduled', 'live', 'ended', 'cancelled']).defaultTo('scheduled');
    table.boolean('recording_enabled').defaultTo(false);
    table.boolean('chat_enabled').defaultTo(true);
    table.boolean('screen_share_enabled').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    table.index(['host_id']);
    table.index(['start_time']);
    table.index(['status']);
  });

  // Meeting participants table
  await knex.schema.createTable('meeting_participants', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('meeting_id').notNullable().references('id').inTable('meetings').onDelete('CASCADE');
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.enum('role', ['host', 'co_host', 'presenter', 'participant']).defaultTo('participant');
    table.timestamp('joined_at').defaultTo(knex.fn.now());
    table.timestamp('left_at');
    table.boolean('is_muted').defaultTo(false);
    table.boolean('is_video_enabled').defaultTo(true);
    table.boolean('is_screen_sharing').defaultTo(false);
    table.boolean('is_host').defaultTo(false);
    
    table.unique(['meeting_id', 'user_id']);
    table.index(['meeting_id']);
    table.index(['user_id']);
  });

  // Messages table
  await knex.schema.createTable('messages', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('meeting_id').notNullable().references('id').inTable('meetings').onDelete('CASCADE');
    table.uuid('sender_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.text('content').notNullable();
    table.enum('type', ['text', 'emoji', 'system', 'file', 'image']).defaultTo('text');
    table.timestamp('timestamp').defaultTo(knex.fn.now());
    table.timestamp('edited_at');
    table.uuid('reply_to_id').references('id').inTable('messages').onDelete('SET NULL');
    
    table.index(['meeting_id']);
    table.index(['sender_id']);
    table.index(['timestamp']);
  });

  // Message mentions table (for @mentions)
  await knex.schema.createTable('message_mentions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('message_id').notNullable().references('id').inTable('messages').onDelete('CASCADE');
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    
    table.unique(['message_id', 'user_id']);
    table.index(['message_id']);
    table.index(['user_id']);
  });

  // Recordings table
  await knex.schema.createTable('recordings', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('meeting_id').notNullable().references('id').inTable('meetings').onDelete('CASCADE');
    table.string('title', 255).notNullable();
    table.integer('duration').notNullable(); // in seconds
    table.bigInteger('file_size').notNullable(); // in bytes
    table.string('download_url', 1000).notNullable();
    table.string('thumbnail_url', 1000);
    table.enum('status', ['processing', 'ready', 'failed']).defaultTo('processing');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    table.index(['meeting_id']);
    table.index(['status']);
  });

  // Meeting settings table (for additional meeting configuration)
  await knex.schema.createTable('meeting_settings', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('meeting_id').unique().notNullable().references('id').inTable('meetings').onDelete('CASCADE');
    table.boolean('waiting_room_enabled').defaultTo(false);
    table.boolean('participant_video_enabled').defaultTo(true);
    table.boolean('participant_audio_enabled').defaultTo(true);
    table.boolean('chat_enabled').defaultTo(true);
    table.boolean('screen_share_enabled').defaultTo(true);
    table.boolean('recording_enabled').defaultTo(false);
    table.boolean('auto_recording_enabled').defaultTo(false);
    table.json('custom_settings'); // for additional settings
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    table.index(['meeting_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('meeting_settings');
  await knex.schema.dropTableIfExists('recordings');
  await knex.schema.dropTableIfExists('message_mentions');
  await knex.schema.dropTableIfExists('messages');
  await knex.schema.dropTableIfExists('meeting_participants');
  await knex.schema.dropTableIfExists('meetings');
  await knex.schema.dropTableIfExists('refresh_tokens');
  await knex.schema.dropTableIfExists('users');
}