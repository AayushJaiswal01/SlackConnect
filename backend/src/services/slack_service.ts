// src/services/slack.service.ts

import { WebClient } from '@slack/web-api';
import { getTokens, saveTokens, FullTokenRecord } from '../db/database';
import axios from 'axios';

/**
 * Gets a valid (non-expired) user access token.
 * If the token is expired, it uses the refresh token to get a new one and saves it.
 * @returns {Promise<string>} A valid user access token.
 */
export async function getValidUserAccessToken(): Promise<string> {
  let tokens = await getTokens();
  if (!tokens) {
    throw new Error('No tokens found. Please authenticate first.');
  }

  // Check if the user access token is expired (with a 60-second buffer for safety)
  if (tokens.expiresAt < Date.now() - 60000) {
    console.log('User access token has expired. Refreshing now...');
    
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
        throw new Error(`Error refreshing token: ${response.data.error}`);
      }

      // Prepare the full new token record for saving
      const newTokens: FullTokenRecord = {
        botAccessToken: tokens.botAccessToken, // Bot token remains the same
        userAccessToken: response.data.access_token,
        refreshToken: response.data.refresh_token, // Slack provides a new refresh token
        expiresAt: Date.now() + (response.data.expires_in * 1000),
      };

      await saveTokens(newTokens);
      console.log('Tokens refreshed and saved successfully.');
      return newTokens.userAccessToken;

    } catch (error) {
      console.error('Fatal error during token refresh:', error);
      // If refresh fails, the user must re-authenticate.
      throw new Error('Could not refresh the Slack token. Please try re-authenticating.');
    }
  }

  // If token is not expired, just return the one from the database
  return tokens.userAccessToken;
}


/**
 * A simple helper to get the long-lived bot access token.
 * @returns {Promise<string>} The bot access token.
 */
export async function getBotAccessToken(): Promise<string> {
    const tokens = await getTokens();
    if (!tokens) {
      throw new Error('No tokens found. Please authenticate first.');
    }
    return tokens.botAccessToken;
}