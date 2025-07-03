
import { WebClient } from '@slack/web-api';
import { getTokens, saveTokens, ExpiringTokenRecord } from '../db/database';
import axios from 'axios';

export async function getValidAccessToken(): Promise<string> {
  let tokens = await getTokens();
  if (!tokens) {
    throw new Error('No tokens found. Please authenticate the application first.');
  }

  if (tokens.expiresAt < Date.now() - 60000) {
    console.log('Access token has expired. Refreshing now...');
    
    try {
      const response = await axios.post('https://slack.com/api/oauth.v2.access', null, {
        params: {
          client_id: process.env.SLACK_CLIENT_ID,
          client_secret: process.env.SLACK_CLIENT_SECRET,
          grant_type: 'refresh_token',
          refresh_token: tokens.refreshToken,
        },
      });

      if (!response.data.ok) {
        throw new Error(`Error refreshing token from Slack: ${response.data.error}`);
      }

      const newTokens: ExpiringTokenRecord = {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token, 
        expiresAt: Date.now() + (response.data.expires_in * 1000),
      };

      await saveTokens(newTokens);
      console.log('Tokens refreshed and saved successfully.');
      
      return newTokens.accessToken;

    } catch (error) {
      console.error('Fatal error during token refresh:', error);
      throw new Error('Could not refresh the Slack token. Please try re-authenticating.');
    }
  }

  console.log('Access token is still valid. No refresh needed.');
  return tokens.accessToken;
}