import fs from 'fs';
import path from 'path';
import http from 'http';
import url from 'url';
import open from 'open';
import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];
const CREDENTIALS_PATH = path.join(process.cwd(), 'config/credentials/service-account.json');
const TOKEN_PATH = path.join(process.cwd(), 'config/credentials/token.json');

/**
 * Get authenticated OAuth2 client
 */
async function getOAuth2Client() {
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    console.error(`Error: OAuth2 credentials file not found at ${CREDENTIALS_PATH}`);
    process.exit(1);
  }

  console.log(`Reading OAuth2 credentials from ${CREDENTIALS_PATH}`);
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
  const { client_id, client_secret } = credentials.web;
  
  // Create an OAuth2 client with the given credentials
  const oauth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    'http://localhost:3000/oauth2callback'
  );

  return oauth2Client;
}

/**
 * Get a new access token using the authorization code flow
 */
async function getNewToken(oauth2Client: any) {
  return new Promise<void>((resolve, reject) => {
    // Generate the authorization URL
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent'  // Force consent to get refresh_token
    });
    
    console.log('Authorize this app by visiting this URL:', authUrl);
    
    // Open the authorization URL in the default browser
    open(authUrl);

    // Start a local web server to handle the callback
    const server = http.createServer(async (req, res) => {
      try {
        if (!req.url) {
          return;
        }

        // Parse the URL and get the code from the query parameters
        const queryParams = url.parse(req.url, true).query;
        
        if (req.url.startsWith('/oauth2callback') && queryParams.code) {
          // Get the authorization code
          const code = queryParams.code as string;
          
          // Close the server
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(`
            <h1>Authentication successful!</h1>
            <p>You can close this window and return to the application.</p>
            <script>window.close();</script>
          `);
          
          server.close();
          
          try {
            // Exchange the authorization code for tokens
            const { tokens } = await oauth2Client.getToken(code);
            
            // Store the tokens
            oauth2Client.setCredentials(tokens);
            
            // Save the tokens for future use
            fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
            console.log(`Token saved to ${TOKEN_PATH}`);
            
            resolve();
          } catch (error) {
            console.error('Error getting access token:', error);
            reject(error);
          }
        } else {
          res.writeHead(404, { 'Content-Type': 'text/html' });
          res.end('<h1>404 Not Found</h1>');
        }
      } catch (error) {
        console.error('Error in callback handler:', error);
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end('<h1>500 Server Error</h1>');
        reject(error);
      }
    }).listen(3000, () => {
      console.log('Listening for authorization callback on http://localhost:3000/oauth2callback');
    });
    
    // Set a timeout to close the server if no response is received
    setTimeout(() => {
      server.close();
      reject(new Error('Authorization timeout: No response received'));
    }, 5 * 60 * 1000); // 5 minutes
  });
}

/**
 * Main function
 */
async function main() {
  try {
    // Ensure credentials directory exists
    const credentialsDir = path.dirname(CREDENTIALS_PATH);
    if (!fs.existsSync(credentialsDir)) {
      fs.mkdirSync(credentialsDir, { recursive: true });
    }
    
    // Get the OAuth2 client
    const oauth2Client = await getOAuth2Client();
    
    // Check if we already have a token
    if (fs.existsSync(TOKEN_PATH)) {
      console.log(`Token already exists at ${TOKEN_PATH}`);
      console.log('Delete this file and run this script again to generate a new token');
      process.exit(0);
    }
    
    // Get a new token
    await getNewToken(oauth2Client);
    
    console.log('Token generated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error generating token:', error);
    process.exit(1);
  }
}

main();