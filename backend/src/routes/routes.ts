// src/routes/api.ts
import { Router } from 'express';
import { WebClient } from '@slack/web-api';
import { getValidAccessToken } from '../services/slack_service';
import { addScheduledMessage, deleteScheduledMessage, getScheduledMessages, getTokens, saveTokens } from '../db/database';

const router = Router();

// OAuth Start: Only request user scopes
router.get('/auth/slack', (req, res) => {
  const user_scopes = ['chat:write', 'channels:read'];
  const redirectUri = `https://slackconnect.onrender.com/api/auth/slack/callback`;
  
  // Note: We use `user_scope` parameter, not `scope`
  const authUrl = `https://slack.com/oauth/v2/authorize?client_id=${process.env.SLACK_CLIENT_ID}&user_scope=${user_scopes.join(',')}&redirect_uri=${encodeURIComponent(redirectUri)}`;
  res.redirect(authUrl);
});

router.get('/auth/slack/callback', async (req, res) => {
  const { code } = req.query;
  const redirectUri = `https://slackconnect.onrender.com/api/auth/slack/callback`;

  try {
    const response = await new WebClient().oauth.v2.access({
      code: code as string,
      client_id: process.env.SLACK_CLIENT_ID!,
      client_secret: process.env.SLACK_CLIENT_SECRET!,
      redirect_uri: redirectUri,
    });

    if (!response.ok) {
      throw new Error(`Slack API error: ${response.error}`);
    }

    // --- THIS IS THE CORRECTED LOGIC ---

    // The user token data is now at the top level of the response object.
    const accessToken = response.access_token as string;
    const refreshToken = response.refresh_token as string;
    const expiresIn = response.expires_in as number;

    // Check that all required fields are present at the top level.
    if (!accessToken || !refreshToken || typeof expiresIn === 'undefined') {
      // If anything is missing, log the actual response for debugging.
      console.error("Incomplete token data from Slack:", response);
      throw new Error('Slack response missing required user token data.');
    }
    
    // Save the correctly parsed tokens.
    await saveTokens({
      accessToken: accessToken,
      refreshToken: refreshToken,
      expiresAt: Date.now() + (expiresIn * 1000),
    });

    res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
    
  } catch (error) {
    console.error('Slack OAuth failed:', error);
    res.status(500).send('Authentication failed!');
  }
});

// ... rest of the file ...

// All subsequent routes now use the single getValidAccessToken function
router.get('/channels', async (req, res) => {
  try {
    const token = await getValidAccessToken();
    const client = new WebClient(token);
    const result = await client.conversations.list({ types: 'public_channel', limit: 200 });
    res.json(result.channels);
  } catch (error) { throw error; }
});

router.post('/send-message', async (req, res) => {
  const { channel, text } = req.body;
  try {
    const token = await getValidAccessToken();
    const client = new WebClient(token);
    await client.chat.postMessage({ channel, text });
    res.json({ success: true });
  } catch (error) { throw error; }
});

// ... The other routes (schedule, cancel, list) follow the same pattern, always calling getValidAccessToken()
// No need to change them further.

export default router;