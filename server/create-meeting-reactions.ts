import { pool, db } from './db';

async function createMeetingReactionsTable() {
  console.log('Creating meeting_reactions table...');
  
  try {
    // Create the meeting_reactions table if it doesn't exist
    await db.execute(`
      CREATE TABLE IF NOT EXISTS meeting_reactions (
        id SERIAL PRIMARY KEY,
        meeting_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        emoji TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    console.log('Successfully created meeting_reactions table');
  } catch (error) {
    console.error('Error creating meeting_reactions table:', error);
  } finally {
    await pool.end();
  }
}

createMeetingReactionsTable();