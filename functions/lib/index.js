"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiSummarizer = exports.aiChatbot = exports.generateReport = exports.helloWorld = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
admin.initializeApp();
// Test endpoint to verify Cloud Functions setup
exports.helloWorld = functions.https.onRequest((request, response) => {
    functions.logger.info('Hello logs!', { structuredData: true });
    response.send('Hello from EduTech Hub Cloud Functions!');
});
var generateReport_1 = require("./generateReport");
Object.defineProperty(exports, "generateReport", { enumerable: true, get: function () { return generateReport_1.generateReport; } });
var aiChatbot_1 = require("./aiChatbot");
Object.defineProperty(exports, "aiChatbot", { enumerable: true, get: function () { return aiChatbot_1.aiChatbot; } });
var aiSummarizer_1 = require("./aiSummarizer");
Object.defineProperty(exports, "aiSummarizer", { enumerable: true, get: function () { return aiSummarizer_1.aiSummarizer; } });
//# sourceMappingURL=index.js.map