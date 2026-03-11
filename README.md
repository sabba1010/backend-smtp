# Backend for Care Connection Application

This backend receives the multi-step application form data from the frontend and sends an email with the full form content (including CV attachment) via SMTP.

## Setup

1. Install dependencies:

   ```bash
   cd Backendclient
   npm install
   ```

2. Copy the environment file:

   ```bash
   cp .env.example .env
   ```

3. Update `.env` with your SMTP credentials and recipient email.

## Running

Start the server:

```bash
npm start
```

Or during development (auto-restarts on changes):

```bash
npm run dev
```

The server will listen on the port configured in `.env` (default `3000`).

## API

### POST /api/send-email

Accepts JSON body matching the frontend form model and sends an email to the configured address.

The frontend already calls this endpoint at `http://localhost:3000/api/send-email`.
