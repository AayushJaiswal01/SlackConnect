// src/routes/api.ts

import { Router } from 'express';
import { WebClient } from '@slack/web-api';
import { getValidUserAccessToken, getBotAccessToken } from '../services/slack_service';
import { addScheduledMessage, deleteScheduledMessage, getScheduledMessages, getTokens, saveTokens } from '../db/database';

const router = Router();

// OAuth Start: Request both bot and user scopes
router.get('/auth/slack', (req, res) => {
  const bot_scopes = ['chat:write', 'channels:read', 'chat:write.scheduled'];
  const user_scopes = ['chat:write']; // Allows the app to send messages as the user
  
  const redirectUri = `${process.env.BACKEND_PUBLIC_URL}/api/auth/slack/callback`;
  
  const authUrl = `https://slack.com/oauth/v2/authorize?client_id=${process.env.SLACK_CLIENT_ID}&scope=${bot_scopes.join(',')}&user_scope=${user_scopes.join(',')}&redirect_uri=${encodeURIComponent(redirectUri)}`;
  res.redirect(authUrl);
});

// OAuth Callback: Parse the new, more complex response from Slack
router.get('/auth/slack/callback', async (req, res) => {
  const { code } = req.query;
  const redirectUri = `${process.env.BACKEND_PUBLIC_URL}/api/auth/slack/callback`;

  try {
    const response = await new WebClient().oauth.v2.access({
      code: code as string,
      client_id: process.env.SLACK_CLIENT_ID!,
      client_secret: process.env.SLACK_CLIENT_SECRET!,
      redirect_uri: redirectUri,
    });

    if (!response.ok) throw new Error(`Slack API error: ${response.error}`);

    const botAccessToken = response.access_token as string;
    const authedUser = response.authed_user as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
    };

    if (!botAccessToken || !authedUser.access_token || !authedUser.refresh_token || typeof authedUser.expires_in === 'undefined') {
      throw new Error('Slack response missing required token data for user scope.');
    }
    
    await saveTokens({
      botAccessToken: botAccessToken,
      userAccessToken: authedUser.access_token,
      refreshToken: authedUser.refresh_token,
      expiresAt: Date.now() + (authedUser.expires_in * 1000),
    });

    res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
  } catch (error) {
    console.error('Slack OAuth failed:', error);
    res.status(500).send('Authentication failed!');
  }
});

// Get Status: No change needed, but good to have
router.get('/status', async (req, res) => {
  const tokens = await getTokens();
  res.json({ connected: !!tokens });
});

// Get Channels: Use the bot token as it has channel reading permissions
router.get('/channels', async (req, res) => {
  try {
    const botToken = await getBotAccessToken();
    const client = new WebClient(botToken);
    const result = await client.conversations.list({ types: 'public_channel', limit: 200 });
    res.json(result.channels);
  } catch (error) {
    throw error; // Let the global error handler manage it
  }
});

// Send Message: Use the token based on the user's choice from the frontend
router.post('/send-message', async (req, res) => {
  const { channel, text, sendAsUser } = req.body;
  try {
    let token: string;
    if (sendAsUser) {
      token = await getValidUserAccessToken();
    } else {
      token = await getBotAccessToken();
    }
    const client = new WebClient(token);
    await client.chat.postMessage({ channel, text });
    res.json({ success: true });
  } catch (error) {
    throw error;
  }
});

// Schedule Message: Use the user token (or you could add a 'sendAsUser' flag here too)
router.post('/schedule-message', async (req, res) => {
    const { channel, text, post_at } = req.body;
    try {
        const token = await getValidUserAccessToken(); // Defaulting to user for scheduling
        const client = new WebClient(token);
        const result = await client.chat.scheduleMessage({ channel, text, post_at });
        await addScheduledMessage({
            id: result.scheduled_message_id as string,
            channelId: channel, text, postAt: post_at
        });
        res.json({ success: true, message: result });
    } catch(error) {
        throw error;
    }
});

// Cancel Message: Use the user token
router.delete('/scheduled-messages/:channelId/:id', async (req, res) => {
    const { id, channelId } = req.params;
    try {
        const token = await getValidUserAccessToken();
        const client = new WebClient(token);
        await client.chat.deleteScheduledMessage({ channel: channelId, scheduled_message_id: id });
        await deleteScheduledMessage(id);
        res.json({ success: true });
    } catch (error) {
        throw error;
    }
});

// List Scheduled Messages: No change needed
router.get('/scheduled-messages', async (req, res) => {
    try {
        res.json(await getScheduledMessages());
    } catch (error) {
        throw error;
    }
});

export default router;