# Context Aware Backend

Express.js API server for Context Aware application.

## Getting Started

### Install Dependencies
```bash
npm install
```

### Environment Setup
Copy `.env.example` to `.env` and configure your environment variables:
```bash
cp .env.example .env
```

### Run Development Server
```bash
npm run dev
```

### Run Production Server
```bash
npm start
```

## Project Structure

- `/src/routes` - API route definitions
- `/src/controllers` - Request handlers
- `/src/middleware` - Express middleware
- `/src/models` - Database models
- `/src/config` - Configuration files
- `/src/utils` - Utility functions

## API Documentation

API endpoints will be documented here as they are developed.

## Tech Stack

- Node.js
- Express.js
- MongoDB with Mongoose
- JWT for authentication

### Password reset email configuration

Set `JWT_SECRET`, `EMAILJS_SERVICE_ID`, `EMAILJS_RESET_TEMPLATE_ID`,
`EMAILJS_PUBLIC_KEY`, and `EMAILJS_PRIVATE_KEY` in the backend environment. The
private key must remain server-side. Configure the EmailJS reset template to use
`to_email`, `to_name`, `otp_code`, and `otp_purpose`. The server sends the code;
the browser never chooses it. Deploy the backend and updated Firestore rules
before enabling password reset. Codes expire after five minutes and verified
reset tokens expire after ten minutes.
