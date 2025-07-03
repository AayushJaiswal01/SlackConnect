import { WebClient } from '@slack/web-api';
import { getTokens, saveTokens, ExpiringTokenRecord } from '../db/database'; 
import axios from 'axios';

export async function getValidAccessToken(): Promise<string> {
  let tokens = await getTokens();
  if (!tokens) throw new Error('No tokens found. Please authenticate.');

  // This check will now work because `tokens` has `expiresAt`.
  if (tokens.expiresAt < Date.now() - 60000) { 
    console.log('Access token has expired. Refreshing now...');
    try {
      const response = await axios.post('https://slack.com/api/oauth.v2.access', null, {
        params: {
          client_id: process.env.SLACK_CLIENT_ID,
          client_secret: process.env.SLACK_CLIENT_SECRET,
          grant_type: 'refresh_token',
          refresh_token: tokens.refreshToken, // This will work because `tokens` has `refreshToken`.
        },
      });

      if (!response.data.ok) throw new Error(`Error refreshing token: ${response.data.error}`);

      const newTokens: ExpiringTokenRecord = {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresAt: Date.now() + (response.data.expires_in * 1000),
      };

      await saveTokens(newTokens);
      return newTokens.accessToken;
    } catch (error) {
      console.error('Fatal error during token refresh:', error);
      throw new Error('Could not refresh Slack token. Please re-authenticate.');
    }
  }

  console.log('Access token is still valid.');
  return tokens.accessToken;
}