// src/routes/api.ts

import { Router } from 'express';
import { WebClient } from '@slack/web-api';
import { getValidAccessToken } from '../services/slack_service';
import { addScheduledMessage, deleteScheduledMessage, getScheduledMessages, getTokens, saveTokens } from '../db/database';

const router = Router();

// OAuth Start: Request the correct, simple user scopes
router.get('/auth/slack', (req, res) => {
  const user_scopes = ['chat:write', 'channels:read'];
  const redirectUri = 'https://slackconnect.onrender.com/api/auth/slack/callback';
  
  const authUrl = `https://slack.com/oauth/v2/authorize?client_id=${process.env.SLACK_CLIENT_ID}&user_scope=${user_scopes.join(',')}&redirect_uri=${encodeURIComponent(redirectUri)}`;
  res.redirect(authUrl);
});

// OAuth Callback: Parse the actual response structure from Slack
router.get('/auth/slack/callback', async (req, res) => {
  const { code } = req.query;
  const redirectUri = 'https://slackconnect.onrender.com/api/auth/slack/callback';

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

    // Based on the logs, the user access token is inside the `authed_user` object.
    const authedUser = response.authed_user as { access_token?: string; };

    if (!authedUser || !authedUser.access_token) {
      console.error("Could not find access_token in authed_user object:", response);
      throw new Error("Failed to extract user access token from Slack response.");
    }
    
    // Save the single, long-lived user token.
    await saveTokens({
      accessToken: authedUser.access_token,
    });

    // Use the environment variable for the frontend URL for flexibility
    res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
    
  } catch (error) {
    console.error('Slack OAuth callback failed:', error);
    res.status(500).send('Authentication failed!');
  }
});

// --- All other routes use the simple getValidAccessToken service ---

router.get('/status', async (req, res, next) => {
  try {
    res.json({ connected: !!(await getTokens()) });
  } catch (error) { next(error); }
});

router.get('/channels', async (req, res, next) => {
  try {
    const token = await getValidAccessToken();
    const client = new WebClient(token);
    const result = await client.conversations.list({ types: 'public_channel', limit: 200 });
    res.json(result.channels);
  } catch (error) { next(error); }
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


export default router;