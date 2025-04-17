import { db } from './db';
import { sql } from 'drizzle-orm';

// This script creates the necessary tables for the application
async function createTables() {
  console.log('Creating missing tables...');
  
  try {
    // Create user_activity_logs table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_activity_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        action VARCHAR NOT NULL,
        description TEXT NOT NULL,
        entity_type VARCHAR NOT NULL,
        entity_id INTEGER,
        ip_address VARCHAR,
        user_agent TEXT,
        metadata JSONB,
        timestamp TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    console.log('user_activity_logs table created successfully');
    
    // Step 1: Clean up duplicate meeting attendees
    console.log('Cleaning up duplicate meeting attendees...');
    
    // Identify duplicates and keep the ones with the lowest ID 
    // (which would be the first ones that were created)
    await db.execute(sql`
      WITH duplicates AS (
        SELECT 
          id,
          meeting_id,
          user_id,
          ROW_NUMBER() OVER (PARTITION BY meeting_id, user_id ORDER BY id) as row_num
        FROM meeting_attendees
      )
      DELETE FROM meeting_attendees
      WHERE id IN (
        SELECT id FROM duplicates WHERE row_num > 1
      );
    `);
    console.log('Duplicate meeting attendees removed');
    
    // Step 2: Now add the unique constraint
    try {
      await db.execute(sql`
        ALTER TABLE meeting_attendees 
        ADD CONSTRAINT meeting_attendees_meeting_id_user_id_unique 
        UNIQUE (meeting_id, user_id);
      `);
      console.log('Added unique constraint to meeting_attendees');
    } catch (constraintError) {
      console.error('Error adding constraint:', constraintError);
    }
    
    console.log('All tables created successfully');
  } catch (error) {
    console.error('Error creating tables:', error);
  }
}

// Run the function
createTables()
  .then(() => {
    console.log('Finished creating tables');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to create tables:', error);
    process.exit(1);
  });