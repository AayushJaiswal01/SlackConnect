import { WebClient } from '@slack/web-api';
import { getTokens } from '../db/database';

export async function getSlackClient(): Promise<WebClient> {
  const tokens = await getTokens();
  if (!tokens || !tokens.accessToken) {
    throw new Error('No tokens found. Please connect to Slack first.');
  }
  return new WebClient(tokens.accessToken);
}