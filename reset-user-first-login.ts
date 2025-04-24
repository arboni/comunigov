/**
 * Script to reset a user's first-time access flags for testing
 * 
 * This script resets the requirePasswordChange flag in the database
 * so that the user will be prompted to change their password on next login.
 * 
 * Usage: 
 * npx tsx reset-user-first-login.ts teste_senha
 */

import { db } from './server/db';
import { users } from './shared/schema';
import { eq } from 'drizzle-orm';

async function resetUserFirstTimeAccess() {
  const username = process.argv[2];
  
  if (!username) {
    console.error('Please provide a username. Example: npx tsx reset-user-first-login.ts teste_senha');
    process.exit(1);
  }
  
  try {
    // Find the user
    const existingUser = await db.select().from(users).where(eq(users.username, username));
    
    if (existingUser.length === 0) {
      console.error(`User '${username}' not found.`);
      process.exit(1);
    }
    
    // Update the user to require password change
    await db.update(users)
      .set({ 
        requirePasswordChange: true,
        // Reset any other first-time flags if needed
      })
      .where(eq(users.id, existingUser[0].id));
    
    console.log(`Reset first-time access flags for user '${username}'`);
    console.log('The user will be required to change their password on next login.');
    
    // Clear any localStorage items for this user (this is for your manual steps)
    console.log('\nIMPORTANT: Now complete these manual steps:');
    console.log('1. Clear localStorage data for this user');
    console.log('2. Insert these commands in your browser console:');
    console.log('   localStorage.removeItem("comunigov-seen-tooltips");');
    console.log('   localStorage.removeItem("comunigov-disabled-tooltips");');
    console.log('   localStorage.removeItem("comunigov-has-seen-welcome-tour");');
    
  } catch (error) {
    console.error('Error resetting user first-time access:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

resetUserFirstTimeAccess();