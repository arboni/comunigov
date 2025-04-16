import { sendCommunicationEmail } from './email-service';
import { storage } from './storage';
import * as fs from 'fs';
import { db } from './db';
import * as path from 'path';

/**
 * This script is for testing email functionality with attachments.
 * It will simulate sending an email with attachments from an existing communication.
 */
async function testEmailWithAttachments() {
  try {
    console.log('Starting email attachment test...');
    
    // 1. Get the most recent communication with attachments
    const communications = await db.query.communications.findMany({
      where: (communications, { eq }) => eq(communications.hasAttachments, true),
      orderBy: (communications, { desc }) => [desc(communications.sentAt)],
      limit: 1
    });
    
    if (communications.length === 0) {
      console.log('No communications with attachments found in the database.');
      return;
    }
    
    const communication = communications[0];
    console.log(`Found communication ID: ${communication.id}, Subject: ${communication.subject}`);
    
    // 2. Get the files for this communication
    const files = await storage.getCommunicationFilesByCommunicationId(communication.id);
    
    if (!files || files.length === 0) {
      console.log(`No files found for communication ID: ${communication.id}`);
      return;
    }
    
    console.log(`Found ${files.length} files for communication ID: ${communication.id}:`);
    files.forEach((file, index) => {
      console.log(`File ${index + 1}: ${file.name} (${file.type}), Path: ${file.filePath}`);
      // Check if file exists on disk
      if (fs.existsSync(file.filePath)) {
        const stats = fs.statSync(file.filePath);
        console.log(`  File exists on disk, size: ${stats.size} bytes`);
      } else {
        console.log(`  [WARNING] File does not exist on disk: ${file.filePath}`);
      }
    });
    
    // 3. Get a test recipient email
    const testEmail = process.env.TEST_EMAIL || 'admin@comunigov.app';
    
    // 4. Try to send the email with attachments
    console.log(`Sending test email to ${testEmail} with ${files.length} attachments...`);
    
    const result = await sendCommunicationEmail(
      testEmail,
      'Test Recipient',
      'Test Sender',
      `Test Email with ${files.length} attachments - ${new Date().toISOString()}`,
      `This is a test email with attachments.\n\nCommunication ID: ${communication.id}\nFiles: ${files.map(f => f.name).join(', ')}`,
      communication.id,
      true
    );
    
    if (result) {
      console.log('Test email with attachments sent successfully!');
    } else {
      console.error('Failed to send test email with attachments.');
    }
    
  } catch (error) {
    console.error('Error in test script:', error);
  }
}

// Run the test
testEmailWithAttachments().then(() => {
  console.log('Test completed.');
  process.exit(0);
}).catch(err => {
  console.error('Test failed with error:', err);
  process.exit(1);
});