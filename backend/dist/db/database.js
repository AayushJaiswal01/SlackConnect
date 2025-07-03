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
exports.saveTokens = saveTokens;
exports.getTokens = getTokens;
exports.addScheduledMessage = addScheduledMessage;
exports.getScheduledMessages = getScheduledMessages;
exports.deleteScheduledMessage = deleteScheduledMessage;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const MOCK_USER_ID = 'default_user';
function saveTokens(data) {
    return __awaiter(this, void 0, void 0, function* () {
        yield prisma.token.upsert({
            where: { userId: MOCK_USER_ID },
            update: { accessToken: data.accessToken },
            create: { userId: MOCK_USER_ID, accessToken: data.accessToken },
        });
    });
}
function getTokens() {
    return __awaiter(this, void 0, void 0, function* () {
        const tokenFromDb = yield prisma.token.findUnique({
            where: { userId: MOCK_USER_ID },
        });
        if (tokenFromDb) {
            return { accessToken: tokenFromDb.accessToken };
        }
        return null;
    });
}
function addScheduledMessage(msg) {
    return __awaiter(this, void 0, void 0, function* () { yield prisma.scheduledMessage.create({ data: msg }); });
}
function getScheduledMessages() {
    return __awaiter(this, void 0, void 0, function* () { return yield prisma.scheduledMessage.findMany({ orderBy: { postAt: 'asc' } }); });
}
function deleteScheduledMessage(id) {
    return __awaiter(this, void 0, void 0, function* () { yield prisma.scheduledMessage.delete({ where: { id: id } }); });
}
