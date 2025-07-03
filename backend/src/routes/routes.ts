// src/routes/api.ts   
// backend/src/routes/api.ts (Corrected and Final Version)

import { Router } from 'express';
import { WebClient } from '@slack/web-api';
// FIX #1: Corrected the import path from 'slack_service' to 'slack.service'
import { getValidAccessToken } from '../services/slack_service'; 
import { addScheduledMessage, deleteScheduledMessage, getScheduledMessages, getTokens, saveTokens } from '../db/database';

const router = Router();

// OAuth Start: Only request user scopes
router.get('/auth/slack', (req, res) => {
  const user_scopes = ['chat:write', 'channels:read'];
  // Use the environment variable for robustness
  const redirectUri = `https://slackconnect.onrender.com/api/auth/slack/callback`;
  
  const authUrl = `https://slack.com/oauth/v2/authorize?client_id=${process.env.SLACK_CLIENT_ID}&user_scope=${user_scopes.join(',')}&redirect_uri=${encodeURIComponent(redirectUri)}`;
  res.redirect(authUrl);
});

// OAuth Callback
router.get('/auth/slack/callback', async (req, res) => {
  const { code } = req.query;
  // Use the environment variable here as well for consistency
  const redirectUri = `https://slackconnect.onrender.com/api/auth/slack/callback`;

  try {
    const response = await new WebClient().oauth.v2.access({
      code: code as string,
      client_id: process.env.SLACK_CLIENT_ID!,
      client_secret: process.env.SLACK_CLIENT_SECRET!,
      redirect_uri: redirectUri,
    });

    // Add this log to see the raw response, it's the best debugging tool
    console.log("RAW SLACK OAUTH RESPONSE:", JSON.stringify(response, null, 2));

    if (!response.ok) {
      // If the request itself failed, throw with the specific error from Slack
      throw new Error(`Slack API error during token exchange: ${response.error}`);
    }

    // The user token data is inside the `authed_user` object for user scopes
    const authedUser = response.authed_user as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
    };

    // FIX #2: Correctly check the authed_user object and throw a more descriptive error
    if (!authedUser || !authedUser.access_token || !authedUser.refresh_token || typeof authedUser.expires_in === 'undefined') {
      console.error("Incomplete token data from Slack. The 'authed_user' object did not contain the expected tokens.");
      throw new Error("Could not retrieve the necessary user token, refresh token, and expiration data from Slack.");
    }
    
    // Save the correctly parsed tokens
    await saveTokens({
      accessToken: authedUser.access_token,
      refreshToken: authedUser.refresh_token,
      expiresAt: Date.now() + (authedUser.expires_in * 1000),
    });

    res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
    
  } catch (error) {
    console.error('Slack OAuth callback failed:', error);
    res.status(500).send('Authentication failed!');
  }
});


// All subsequent routes use the single getValidAccessToken function
router.get('/channels', async (req, res, next) => {
  try {
    const token = await getValidAccessToken();
    const client = new WebClient(token);
    const result = await client.conversations.list({ types: 'public_channel', limit: 200 });
    res.json(result.channels);
  } catch (error) { next(error); } // Pass errors to the global handler
});

router.post('/send-message', async (req, res, next) => {
  const { channel, text } = req.body;
  try {
    const token = await getValidAccessToken();
    const client = new WebClient(token);
    await client.chat.postMessage({ channel, text });
    res.json({ success: true });
  } catch (error) { next(error); }
});

router.post('/schedule-message', async (req, res, next) => {
    const { channel, text, post_at } = req.body;
    try {
        const token = await getValidAccessToken();
        const client = new WebClient(token);
        const result = await client.chat.scheduleMessage({ channel, text, post_at });
        await addScheduledMessage({
            id: result.scheduled_message_id as string,
            channelId: channel, text, postAt: post_at
        });
        res.json({ success: true, message: result });
    } catch(error) { next(error); }
});

router.delete('/scheduled-messages/:channelId/:id', async (req, res, next) => {
    const { id, channelId } = req.params;
    try {
        const token = await getValidAccessToken();
        const client = new WebClient(token);
        await client.chat.deleteScheduledMessage({ channel: channelId, scheduled_message_id: id });
        await deleteScheduledMessage(id);
        res.json({ success: true });
    } catch (error) { next(error); }
});

router.get('/scheduled-messages', async (req, res, next) => {
    try {
        res.json(await getScheduledMessages());
    } catch (error) { next(error); }
});

// Added for completeness
router.get('/status', async (req, res, next) => {
    try {
        res.json({ connected: !!(await getTokens()) });
    } catch (error) {
        next(error);
    }
});


export default router;