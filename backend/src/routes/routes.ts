//https://slackconnect.onrender.com/

import { Router } from 'express';
import { WebClient } from '@slack/web-api';
import { getValidAccessToken } from '../services/slack_service';
import { addScheduledMessage, deleteScheduledMessage, getScheduledMessages, getTokens, saveTokens } from '../db/database';

const router = Router();

router.get('/auth/slack', (req, res) => {
  const user_scopes = ['chat:write', 'channels:read'];
  const redirectUri = `https://slackconnect.onrender.com/api/auth/slack/callback`;
  
  const authUrl = `https://slack.com/oauth/v2/authorize?client_id=${process.env.SLACK_CLIENT_ID}&user_scope=${user_scopes.join(',')}&redirect_uri=${encodeURIComponent(redirectUri)}`;
  res.redirect(authUrl);
});

router.get('/auth/slack/callback', async (req, res, next) => {
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
      throw new Error(`Slack API error during token exchange: ${response.error}`);
    }

    const accessToken = response.access_token as string;
    const refreshToken = response.refresh_token as string;
    const expiresIn = response.expires_in as number;

    if (!accessToken || !refreshToken || typeof expiresIn === 'undefined') {
      console.error("Incomplete token data from Slack. Expected access_token, refresh_token, and expires_in.", response);
      throw new Error("Failed to retrieve the necessary expiring token data from Slack.");
    }
    
    await saveTokens({
      accessToken: accessToken,
      refreshToken: refreshToken,
      expiresAt: Date.now() + (expiresIn * 1000),
    });

    res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
    
  } catch (error) {
    next(error);
  }
});


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
    const now_in_seconds = Math.floor(Date.now() / 1000);
    if (post_at < now_in_seconds + 60) {
      const validationError = new Error('Scheduled time must be at least one minute in the future.');
      (validationError as any).statusCode = 400; 
      return next(validationError);
    }
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