# Slack Connect Application

Slack Connect is a full-stack web application designed to connect to a Slack workspace, send messages immediately on behalf of a user, and schedule messages for future delivery. This project demonstrates skills in Node.js (TypeScript), React, database management with Prisma, and secure integration with third-party APIs using OAuth 2.0, including a complete refresh token implementation for continuous service.

## Live Application
*   **Frontend:** [https://slackconnect-1.onrender.com](https://slackconnect-1.onrender.com)
*   **Backend:** [https://slackconnect.onrender.com](https://slackconnect.onrender.com)

## Core Features

*   **Secure User-Based Connection:** Implements the Slack OAuth 2.0 flow to securely connect and perform actions on behalf of the authorizing user.
*   **Automated Token Refresh:** Features a complete refresh token lifecycle. The application automatically detects expired access tokens and uses a stored refresh token to obtain a new one from Slack without requiring any user re-authentication.
*   **Immediate & Scheduled Messaging:** A user-friendly interface to compose messages and send them instantly or schedule them for a future date and time.
*   **Scheduled Message Management:** A dashboard to view and cancel all pending scheduled messages before they are sent.

## Technology Stack

*   **Backend:** Node.js, Express.js, TypeScript
*   **Frontend:** React, TypeScript, Axios
*   **Database ORM:** Prisma
*   **Database:** PostgreSQL (Cloud-hosted on Neon)
*   **Deployment:** Render (for both frontend and backend services)

---

## Setup and Installation

Follow these instructions to set up and run the project locally.

### Prerequisites

*   Node.js (v18 or later) & npm
*   A Slack workspace with permissions to install apps
*   A free [Neon](https://neon.tech/) account for the PostgreSQL database
*   `ngrok` for exposing your local server during the initial OAuth setup

### 1. Slack App Configuration

1.  Create a new Slack App at [api.slack.com/apps](https://api.slack.com/apps).
2.  Navigate to the **"OAuth & Permissions"** page.
3.  Under **"User Token Scopes"**, add the following scopes:
    *   `chat:write`
    *   `channels:read`
4.  Scroll down to the **"Token Rotation"** section and turn the feature **ON**. This is required to enable the refresh token flow.
5.  Note your **Client ID** and **Client Secret** from the "Basic Information" page.

### 2. Backend Setup

1.  Navigate to the `backend` directory: `cd backend`
2.  Install dependencies: `npm install`
3.  Create a `.env` file in the `backend` directory and add the following variables:
    ```
    DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
    SLACK_CLIENT_ID=your_client_id_here
    SLACK_CLIENT_SECRET=your_client_secret_here
    FRONTEND_URL=http://localhost:3000
    BACKEND_PUBLIC_URL=https://your-ngrok-url.ngrok-free.app
    ```
4.  Apply database migrations: `npx prisma migrate dev`
5.  Run the backend server: `npm start` (This will run `ts-node` locally).

### 3. Frontend Setup

1.  In a new terminal, navigate to the `frontend` directory: `cd frontend`
2.  Install dependencies: `npm install`
3.  Run the frontend server: `npm start`
4.  The application will be available at `http://localhost:3000`.

### 4. Ngrok and Final Configuration

1.  In a third terminal, expose your local backend server: `ngrok http 8080`
2.  Copy the HTTPS URL from ngrok and set it as the `BACKEND_PUBLIC_URL` in your backend's `.env` file.
3.  In your Slack App settings, add the ngrok callback URL to **"Redirect URLs"**: `https://your-ngrok-url.ngrok-free.app/api/auth/slack/callback`
4.  Restart your backend server to load the new environment variable. You are now ready to authenticate.

---

## Architectural Overview

The application is structured as a modern monorepo with separate `frontend` and `backend` services, deployed independently on Render.

*   **OAuth 2.0 & Token Management:** The authentication process is initiated by the user and handled by the backend. By enabling Token Rotation in the Slack App settings, the backend receives an expiring `access_token`, a `refresh_token`, and an `expires_in` duration. These three pieces of data are securely stored in the PostgreSQL database.

*   **Refresh Token Logic:** Before any action that requires talking to Slack (like sending a message), the backend's service layer checks if the stored `access_token` is expired. If it is, the service automatically and silently uses the stored `refresh_token` to request a new set of tokens from Slack. This new set is then saved to the database, ensuring the application can continue to function without ever requiring the user to log in again.

*   **Scheduled Task Handling:** Message scheduling is handled by leveraging Slack's native `chat.scheduleMessage` API. When a user schedules a message, the backend calls this API and stores the `scheduled_message_id` returned by Slack in its own database. To cancel a message, the backend uses this stored ID to call the `chat.deleteScheduledMessage` API, ensuring reliable management without needing a local cron job.

## Challenges and Learnings

A significant challenge and learning opportunity was navigating the different token models offered by Slack's OAuth 2.0 API.

Initially, the standard API flow provided a long-lived, non-expiring token, which did not align with the project's requirement to implement a refresh token cycle. The key insight was discovering that this behavior is controlled by the **"Token Rotation"** setting within the Slack App configuration.

By enabling this feature, the API's response changed to provide the expected short-lived `access_token` and the necessary `refresh_token`. This allowed for the implementation of the full, robust refresh logic as specified. This process highlighted the importance of not only reading API documentation but also understanding an API's configuration options and using logging to adapt to the real-world data structures it provides.