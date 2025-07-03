// src/services/slack.service.ts
import { WebClient } from '@slack/web-api';
import { getTokens, saveTokens, UserTokenRecord } from '../db/database';
import axios from 'axios';

// The function name is now generic, as it's the only token we care about
export async function getValidAccessToken(): Promise<string> {
  let tokens = await getTokens();
  if (!tokens) throw new Error('No tokens found. Please authenticate.');

  if (tokens.expiresAt < Date.now() - 60000) {
    console.log('Access token expired, refreshing...');
    try {
      const response = await axios.post('https://slack.com/api/oauth.v2.access', null, {
        params: {
          client_id: process.env.SLACK_CLIENT_ID,
          client_secret: process.env.SLACK_CLIENT_SECRET,
          grant_type: 'refresh_token',
          refresh_token: tokens.refreshToken,
        },
      });

      if (!response.data.ok) throw new Error(`Error refreshing token: ${response.data.error}`);

      const newTokens: UserTokenRecord = {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresAt: Date.now() + (response.data.expires_in * 1000),
      };
      await saveTokens(newTokens);
      console.log('Tokens refreshed and saved successfully.');
      return newTokens.accessToken;
    } catch (error) {
      console.error('Failed to refresh Slack token:', error);
      throw new Error('Could not refresh Slack token. Please re-authenticate.');
    }
  }
  return tokens.accessToken;
}