"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const web_api_1 = require("@slack/web-api");
const slack_service_1 = require("../services/slack_service");
const database_1 = require("../db/database");
const router = (0, express_1.Router)();
router.get('/auth/slack', (req, res) => {
    const scopes = ['chat:write', 'channels:read']; // Correct, simplified scopes
    const redirectUri = `${process.env.BACKEND_PUBLIC_URL}/api/auth/slack/callback`;
    const authUrl = `https://slack.com/oauth/v2/authorize?client_id=${process.env.SLACK_CLIENT_ID}&scope=${scopes.join(',')}&redirect_uri=${encodeURIComponent(redirectUri)}`;
    res.redirect(authUrl);
});
router.get('/auth/slack/callback', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { code } = req.query;
    const redirectUri = `${process.env.BACKEND_PUBLIC_URL}/api/auth/slack/callback`;
    try {
        const client = new web_api_1.WebClient();
        const response = yield client.oauth.v2.access({
            code: code,
            client_id: process.env.SLACK_CLIENT_ID,
            client_secret: process.env.SLACK_CLIENT_SECRET,
            redirect_uri: redirectUri,
        });
        if (!response.ok || !response.access_token) {
            throw new Error(`Slack API error or missing access token: ${response.error || 'No token'}`);
        }
        yield (0, database_1.saveTokens)({
            accessToken: response.access_token,
        });
        res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
    }
    catch (error) {
        console.error('Slack OAuth failed:', error);
        res.status(500).send('Authentication failed!');
    }
}));
router.get('/status', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const tokens = yield (0, database_1.getTokens)();
    res.json({ connected: !!tokens });
}));
router.get('/channels', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const client = yield (0, slack_service_1.getSlackClient)();
        const result = yield client.conversations.list({ types: 'public_channel', limit: 200 });
        res.json(result.channels);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}));
router.post('/send-message', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { channel, text } = req.body;
    try {
        const client = yield (0, slack_service_1.getSlackClient)();
        yield client.chat.postMessage({ channel, text });
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}));
router.post('/schedule-message', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { channel, text, post_at } = req.body; // Unix timestamp in seconds
    try {
        const client = yield (0, slack_service_1.getSlackClient)();
        const result = yield client.chat.scheduleMessage({ channel, text, post_at });
        yield (0, database_1.addScheduledMessage)({
            id: result.scheduled_message_id,
            channelId: channel,
            text: text,
            postAt: post_at
        });
        res.json({ success: true, message: result });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}));
router.get('/scheduled-messages', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        res.json(yield (0, database_1.getScheduledMessages)());
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}));
router.delete('/scheduled-messages/:channelId/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id, channelId } = req.params; // Read BOTH from URL params
    try {
        const client = yield (0, slack_service_1.getSlackClient)();
        yield client.chat.deleteScheduledMessage({
            channel: channelId,
            scheduled_message_id: id,
        });
        yield (0, database_1.deleteScheduledMessage)(id);
        res.json({ success: true });
    }
    catch (error) {
        // This is where the global error handler will catch the error
        // and log it on Render.
        throw error; // Re-throw the error to be caught by the global handler
    }
}));
exports.default = router;
