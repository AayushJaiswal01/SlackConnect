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

// OAuth Callback: The response will now only contain the user's token info
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

    if (!response.ok) throw new Error(`Slack API error: ${response.error}`);

    // The token info is inside the authed_user object
    const authedUser = response.authed_user as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
    };

    if (!authedUser.access_token || !authedUser.refresh_token || typeof authedUser.expires_in === 'undefined') {
      throw new Error('Slack response missing required user token data.');
    }
    
    await saveTokens({
      accessToken: authedUser.access_token,
      refreshToken: authedUser.refresh_token,
      expiresAt: Date.now() + (authedUser.expires_in * 1000),
    });

    res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
  } catch (error) {
    console.error('Slack OAuth failed:', error);
    res.status(500).send('Authentication failed!');
  }
});

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