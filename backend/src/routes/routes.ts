import { Router } from 'express';
import { WebClient } from '@slack/web-api';
import { getSlackClient } from '../services/slack_service';
import { addScheduledMessage, deleteScheduledMessage, getScheduledMessages, getTokens, saveTokens } from '../db/database';

const router = Router();

router.get('/auth/slack', (req, res) => {
  const scopes = ['chat:write', 'channels:read']; // Correct, simplified scopes
  const redirectUri = `${process.env.BACKEND_PUBLIC_URL}/api/auth/slack/callback`;
  const authUrl = `https://slack.com/oauth/v2/authorize?client_id=${process.env.SLACK_CLIENT_ID}&scope=${scopes.join(',')}&redirect_uri=${encodeURIComponent(redirectUri)}`;
  res.redirect(authUrl);
});

router.get('/auth/slack/callback', async (req, res) => {
    const { code } = req.query;
    const redirectUri = `${process.env.BACKEND_PUBLIC_URL}/api/auth/slack/callback`;
  
    try {
      const client = new WebClient();
      const response = await client.oauth.v2.access({
        code: code as string,
        client_id: process.env.SLACK_CLIENT_ID!,
        client_secret: process.env.SLACK_CLIENT_SECRET!,
        redirect_uri: redirectUri,
      });
  
      if (!response.ok || !response.access_token) {
        throw new Error(`Slack API error or missing access token: ${response.error || 'No token'}`);
      }
  
      await saveTokens({
        accessToken: response.access_token as string,
      });
  
      res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
  
    } catch (error) {
      console.error('Slack OAuth failed:', error);
      res.status(500).send('Authentication failed!');
    }
  });
router.get('/status', async (req, res) => {
    const tokens = await getTokens();
    res.json({ connected: !!tokens });
});

router.get('/channels', async (req, res) => {
  try {
    const client = await getSlackClient();
    const result = await client.conversations.list({ types: 'public_channel', limit: 200 });
    res.json(result.channels);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/send-message', async (req, res) => {
  const { channel, text } = req.body;
  try {
    const client = await getSlackClient();
    await client.chat.postMessage({ channel, text });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/schedule-message', async (req, res) => {
  const { channel, text, post_at } = req.body; // Unix timestamp in seconds
  try {
    const client = await getSlackClient();
    const result = await client.chat.scheduleMessage({ channel, text, post_at });
    await addScheduledMessage({
        id: result.scheduled_message_id as string,
        channelId: channel,
        text: text,
        postAt: post_at
    });
    res.json({ success: true, message: result });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/scheduled-messages', async (req, res) => {
    try {
        res.json(await getScheduledMessages());
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

router.delete('/scheduled-messages/:id', async (req, res) => {
    const { id } = req.params;
    const { channelId } = req.body; // channelId is required by Slack's API
    try {
        const client = await getSlackClient();
        await client.chat.deleteScheduledMessage({
            channel: channelId,
            scheduled_message_id: id,
        });
        await deleteScheduledMessage(id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

export default router;