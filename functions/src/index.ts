import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

// Test endpoint to verify Cloud Functions setup
export const helloWorld = functions.https.onRequest((request, response) => {
  functions.logger.info('Hello logs!', { structuredData: true });
  response.send('Hello from EduTech Hub Cloud Functions!');
});

export { generateReport } from './generateReport';
export { aiChatbot } from './aiChatbot';
export { aiSummarizer } from './aiSummarizer';
