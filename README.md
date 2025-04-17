# ComuniGov - Institutional Communication Platform

ComuniGov is a comprehensive institutional communication platform designed for city halls and public institutions to streamline communication, manage meetings, and coordinate tasks.

## Features

- **Multi-channel Communication:**
  - Email (SendGrid)
  - WhatsApp (Twilio)
  - Telegram (requires bot token)
  - System notifications

- **File Attachment Management:**
  - Upload and store files securely
  - Attach files to communications
  - Preview and download attachments

- **Meeting Management:**
  - Schedule and organize meetings
  - Track attendees and confirmations
  - Associate meetings with subjects and tasks

- **Task Management:**
  - Create and assign tasks
  - Set deadlines and priorities
  - Track task status and comments

- **Entity Management:**
  - Manage internal departments and external organizations
  - Track contact information and relationships
  - Assign users to entities

- **User Achievement System:**
  - Award badges for accomplishments
  - Track user progress and engagement
  - Celebrate achievements with visual effects

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- SendGrid account for email
- Twilio account for WhatsApp
- (Optional) Telegram bot for Telegram messaging

### Environment Variables

Configure the following environment variables:

- **Database:**
  - `DATABASE_URL`: PostgreSQL connection string

- **SendGrid (Email):**
  - `SENDGRID_API_KEY`: Your SendGrid API key
  - `SENDGRID_FROM_EMAIL`: Email address to send from

- **Twilio (WhatsApp):**
  - `TWILIO_ACCOUNT_SID`: Your Twilio account SID
  - `TWILIO_AUTH_TOKEN`: Your Twilio auth token
  - `TWILIO_WHATSAPP_NUMBER`: Your Twilio WhatsApp number (with +)

- **Telegram (Optional):**
  - `TELEGRAM_BOT_TOKEN`: Your Telegram bot token

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/comunigov.git
   cd comunigov
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up the database:
   ```bash
   npm run db:push
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Usage

### Authentication

- Access the login page at `/auth`
- Default admin credentials:
  - Username: admin
  - Password: admin123 (change this in production)

### Communication

1. Go to Communications tab
2. Click "New Communication"
3. Select recipients (users and/or entities)
4. Choose communication channel (Email, WhatsApp, Telegram)
5. Write your message
6. Attach files if needed
7. Send the communication

### Testing Communication Channels

Test all communication channels with:

```bash
npx tsx test-all-channels.ts your@email.com +1234567890 @telegramuser
```

Or test individual channels:

- WhatsApp:
  ```bash
  npx tsx test-whatsapp.ts +1234567890
  ```

## Troubleshooting

### WhatsApp Integration

For detailed WhatsApp troubleshooting, refer to `WHATSAPP_INTEGRATION_GUIDE.md`.

Common issues:
- Users must join the Twilio WhatsApp sandbox before receiving messages
- Phone numbers must include country code (e.g., +1234567890)

### Telegram Integration

For detailed Telegram troubleshooting, refer to `TELEGRAM_INTEGRATION_GUIDE.md`.

Common issues:
- Users must start a conversation with your Telegram bot
- Telegram bot token must be properly configured

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with React, Express, and PostgreSQL
- Uses Drizzle ORM for database management
- Email integration via SendGrid
- WhatsApp integration via Twilio
- File management using Multer