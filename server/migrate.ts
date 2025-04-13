import { db } from './db';
import * as schema from '@shared/schema';
import { sql } from 'drizzle-orm';

// Main function to run the migrations
async function applyMigrations() {
  console.log('Starting database migrations...');
  
  try {
    // Create subjects table
    console.log('Creating subjects table if it doesn\'t exist...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS subjects (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        created_by INTEGER NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        description TEXT
      );
    `);
    
    // Alter meetings table to add registered subject columns
    console.log('Altering meetings table to add registered subject fields...');
    
    // Check if is_registered_subject column exists
    const isRegisteredSubjectExists = await columnExists('meetings', 'is_registered_subject');
    if (!isRegisteredSubjectExists) {
      await db.execute(sql`
        ALTER TABLE meetings ADD COLUMN is_registered_subject BOOLEAN DEFAULT FALSE;
      `);
      console.log('Added is_registered_subject column to meetings table');
    }
    
    // Check if subject_id column exists
    const meetingSubjectIdExists = await columnExists('meetings', 'subject_id');
    if (!meetingSubjectIdExists) {
      await db.execute(sql`
        ALTER TABLE meetings ADD COLUMN subject_id INTEGER REFERENCES subjects(id);
      `);
      console.log('Added subject_id column to meetings table');
    }
    
    // Alter tasks table to add new columns
    console.log('Altering tasks table to add subject_id and user fields...');
    
    // Check if subject_id column exists
    const subjectIdExists = await columnExists('tasks', 'subject_id');
    if (!subjectIdExists) {
      await db.execute(sql`
        ALTER TABLE tasks ADD COLUMN subject_id INTEGER REFERENCES subjects(id);
      `);
      console.log('Added subject_id column to tasks table');
    }
    
    // Check if userId column exists
    const userIdExists = await columnExists('tasks', 'user_id');
    if (!userIdExists) {
      await db.execute(sql`
        ALTER TABLE tasks ADD COLUMN user_id INTEGER REFERENCES users(id);
      `);
      console.log('Added user_id column to tasks table');
    }
    
    // Check if ownerName column exists
    const ownerNameExists = await columnExists('tasks', 'owner_name');
    if (!ownerNameExists) {
      await db.execute(sql`
        ALTER TABLE tasks ADD COLUMN owner_name VARCHAR(255);
      `);
      console.log('Added owner_name column to tasks table');
    }
    
    // Check if ownerEmail column exists
    const ownerEmailExists = await columnExists('tasks', 'owner_email');
    if (!ownerEmailExists) {
      await db.execute(sql`
        ALTER TABLE tasks ADD COLUMN owner_email VARCHAR(255);
      `);
      console.log('Added owner_email column to tasks table');
    }
    
    // Check if ownerPhone column exists
    const ownerPhoneExists = await columnExists('tasks', 'owner_phone');
    if (!ownerPhoneExists) {
      await db.execute(sql`
        ALTER TABLE tasks ADD COLUMN owner_phone VARCHAR(255);
      `);
      console.log('Added owner_phone column to tasks table');
    }
    
    // Check if isRegisteredUser column exists
    const isRegisteredUserExists = await columnExists('tasks', 'is_registered_user');
    if (!isRegisteredUserExists) {
      await db.execute(sql`
        ALTER TABLE tasks ADD COLUMN is_registered_user BOOLEAN DEFAULT FALSE;
      `);
      console.log('Added is_registered_user column to tasks table');
    }
    
    // Check if assignedToUserId column exists
    const assignedToUserIdExists = await columnExists('tasks', 'assigned_to_user_id');
    if (!assignedToUserIdExists) {
      await db.execute(sql`
        ALTER TABLE tasks ADD COLUMN assigned_to_user_id INTEGER REFERENCES users(id);
      `);
      console.log('Added assigned_to_user_id column to tasks table');
    }
    
    // Check if assigned_to column exists and drop it if it does
    const assignedToExists = await columnExists('tasks', 'assigned_to');
    if (assignedToExists) {
      await db.execute(sql`
        ALTER TABLE tasks DROP COLUMN assigned_to;
      `);
      console.log('Dropped assigned_to column from tasks table');
    }
    
    console.log('Database migrations completed successfully!');
  } catch (error) {
    console.error('Error applying migrations:', error);
    throw error;
  }
}

// Helper function to check if a column exists in a table
async function columnExists(tableName: string, columnName: string): Promise<boolean> {
  const result = await db.execute(sql`
    SELECT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = ${tableName} AND column_name = ${columnName}
    );
  `);
  
  return result.rows[0].exists;
}

// Run the migrations
applyMigrations().then(() => {
  console.log('All migrations have been applied');
  process.exit(0);
}).catch(error => {
  console.error('Migration failed:', error);
  process.exit(1);
});