/**
 * Check Twilio WhatsApp Configuration
 * 
 * This script checks your Twilio configuration and provides guidance
 * on how to properly set up and test the WhatsApp integration.
 */

// Get Twilio configuration from environment variables
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER;

console.log('======== ComuniGov Twilio WhatsApp Configuration Check ========\n');

// Check if Twilio credentials are configured
console.log('1. Checking Twilio credentials:');
console.log(`   TWILIO_ACCOUNT_SID: ${TWILIO_ACCOUNT_SID ? '✅ Configured' : '❌ Missing'}`);
console.log(`   TWILIO_AUTH_TOKEN: ${TWILIO_AUTH_TOKEN ? '✅ Configured' : '❌ Missing'}`);
console.log(`   TWILIO_WHATSAPP_NUMBER: ${TWILIO_WHATSAPP_NUMBER ? '✅ Configured' : '❌ Missing'}`);

if (TWILIO_WHATSAPP_NUMBER) {
  console.log(`   WhatsApp Number: ${TWILIO_WHATSAPP_NUMBER}`);
}

// Overall configuration status
const isConfigured = TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_WHATSAPP_NUMBER;
console.log('\n2. Overall Configuration Status:');
console.log(`   ${isConfigured ? '✅ Twilio WhatsApp is properly configured' : '❌ Twilio WhatsApp is NOT properly configured'}`);

// Sandbox instructions
console.log('\n3. WhatsApp Sandbox Connection:');
console.log('   Before receiving messages, you must join the Twilio WhatsApp sandbox:');
console.log('   1. Log in to your Twilio account');
console.log('   2. Navigate to the WhatsApp sandbox section');
console.log('   3. Find your unique join code (e.g., "join apple-green")');
console.log(`   4. Send this code from your WhatsApp to: ${TWILIO_WHATSAPP_NUMBER || 'your Twilio WhatsApp number'}`);
console.log('   5. You should receive a confirmation message when successful');

// Testing instructions
console.log('\n4. Testing Your WhatsApp Integration:');
console.log('   To test sending a WhatsApp message:');
console.log('   npx tsx test-whatsapp.ts +YOUR_PHONE_NUMBER');
console.log('   Replace +YOUR_PHONE_NUMBER with your full phone number including country code');

if (!isConfigured) {
  console.log('\n⚠️ ACTION REQUIRED:');
  console.log('   You need to configure your Twilio credentials. Add the following to your environment:');
  
  if (!TWILIO_ACCOUNT_SID) console.log('   - TWILIO_ACCOUNT_SID: Your Twilio Account SID');
  if (!TWILIO_AUTH_TOKEN) console.log('   - TWILIO_AUTH_TOKEN: Your Twilio Auth Token');
  if (!TWILIO_WHATSAPP_NUMBER) console.log('   - TWILIO_WHATSAPP_NUMBER: Your Twilio WhatsApp number with format +14155238886');
}

console.log('\n5. For More Information:');
console.log('   See the WHATSAPP_INTEGRATION_GUIDE.md file for detailed instructions and troubleshooting');
console.log('\n================================================================');