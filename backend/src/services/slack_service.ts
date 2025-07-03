// src/services/slack.service.ts

import { WebClient } from '@slack/web-api';
import { getTokens } from '../db/database';

/**
 * Gets the stored user access token from the database.
 * @returns {Promise<string>} The user access token.
 */
export async function getValidAccessToken(): Promise<string> {
  const tokens = await getTokens();
  if (!tokens || !tokens.accessToken) {
    throw new Error('No valid token found. Please authenticate the application first.');
  }
  return tokens.accessToken;
}