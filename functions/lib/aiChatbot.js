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
exports.aiChatbot = void 0;
const functions = __importStar(require("firebase-functions"));
const generative_ai_1 = require("@google/generative-ai");
// Simple simulated responses for sandbox/placeholder mode
const getSimulatedChatResponse = (prompt) => {
    const lowercase = prompt.toLowerCase();
    if (lowercase.includes('hello') || lowercase.includes('hi') || lowercase.includes('hey')) {
        return "Hello! I am your EduTech Hub AI Assistant. I can help you find assignments, check class schedules, review attendance logs, or summarize notes. What can I do for you today?";
    }
    if (lowercase.includes('schedule') || lowercase.includes('timetable') || lowercase.includes('class')) {
        return "You can view and build course timetables directly in the 'Schedule Timetable' section. For students, daily schedules are loaded automatically on the dashboard, checking for conflicts before scheduling.";
    }
    if (lowercase.includes('attendance') || lowercase.includes('qr')) {
        return "EduTech Hub uses a QR-code scanner system for secure attendance tracking. Faculty generate a class session QR code (which changes/expires), and students scan it on their mobile screens. Circular analytics display attendance ratios.";
    }
    if (lowercase.includes('assignment') || lowercase.includes('homework') || lowercase.includes('grade')) {
        return "Assignments are listed in 'My Assignments' for students and 'Manage Assignments' for faculty. Students can upload files (PDFs/videos) to submissions, and faculty can grade and provide feedback in real time.";
    }
    if (lowercase.includes('summarize') || lowercase.includes('notes') || lowercase.includes('summary')) {
        return "To summarize lecture notes, click the 'AI Summarize' button next to any posted note PDF. The AI summarizer will extract the note text and compile a bulleted outline of the key concepts.";
    }
    if (lowercase.includes('help') || lowercase.includes('what can you do')) {
        return "I can answer questions about the portal features, summarize uploaded PDF notes, or provide academic guidance. Try asking me: 'How does attendance work?' or 'Where do I find my assignments?'";
    }
    return `Thank you for your question: "${prompt}". In local sandbox mode, I simulate answering questions about EduTech Hub features (timetables, attendance, grades, PDF summaries). Configure your GEMINI_API_KEY in functions to enable live Gemini AI generation!`;
};
exports.aiChatbot = functions.https.onRequest(async (req, res) => {
    // CORS configuration
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }
    const prompt = req.query.prompt || req.body.prompt;
    if (!prompt) {
        res.status(400).send({ error: 'Missing prompt parameter.' });
        return;
    }
    try {
        // Resolve key
        const apiKey = process.env.GEMINI_API_KEY || functions.config().gemini?.key;
        const isMock = !apiKey || apiKey.includes('Placeholder') || apiKey.includes('placeholder');
        if (isMock) {
            // Simulate slow AI response for UX fidelity
            await new Promise(resolve => setTimeout(resolve, 800));
            const simulatedText = getSimulatedChatResponse(prompt);
            res.status(200).send({ response: simulatedText, mode: 'simulated' });
            return;
        }
        // Google Gemini API query
        const genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        // Add custom system instruction/context to model query
        const contextPrompt = `You are the EduTech Hub AI Assistant, an advanced AI chatbot integrated inside a school management platform. Answer the user request professionally: ${prompt}`;
        const result = await model.generateContent(contextPrompt);
        const responseText = result.response.text();
        res.status(200).send({ response: responseText, mode: 'live' });
    }
    catch (err) {
        console.error('Error in aiChatbot Cloud Function:', err);
        res.status(500).send({ error: err.message || 'Failed to generate AI chatbot response.' });
    }
});
//# sourceMappingURL=aiChatbot.js.map