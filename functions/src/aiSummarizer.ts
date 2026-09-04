import * as functions from 'firebase-functions';
import { GoogleGenerativeAI } from '@google/generative-ai';
import pdf from 'pdf-parse';

// Fallback mockup summary for sandbox/placeholder mode
const getSimulatedSummary = (fileUrl: string): string => {
  return `### 📚 Lecture Notes Summary (Simulated)
This note summary was generated in local sandbox mode. Here is an outline of the key topics covered in the lecture:

- **1. Core Concept Overview**: Review of fundamental architectural models, theoretical frameworks, and basic definitions discussed in the syllabus.
- **2. Practical Applications**: Step-by-step methodologies to apply the formulas and algorithms to solve real-world problems.
- **3. Case Study Analysis**: Highlights and retrospectives of successful deployments and historical design patterns.
- **4. Exam Tips & Key Terms**:
  - Focus heavily on sections 2 and 3 for the upcoming midterm.
  - Review terminology: *efficiency ratios, concurrency constraints, state preservation*.

*Configure your GEMINI_API_KEY inside the backend environment to enable live, server-side PDF text extraction and custom Gemini summaries!*`;
};

export const aiSummarizer = functions.https.onRequest(async (req, res) => {
  // CORS configuration
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  const fileUrl = (req.query.fileUrl as string) || (req.body.fileUrl as string);

  if (!fileUrl) {
    res.status(400).send({ error: 'Missing fileUrl parameter.' });
    return;
  }

  try {
    // Resolve key
    const apiKey = process.env.GEMINI_API_KEY || functions.config().gemini?.key;
    const isMock = !apiKey || apiKey.includes('Placeholder') || apiKey.includes('placeholder');

    if (isMock) {
      // Simulate slow AI response for UX fidelity
      await new Promise(resolve => setTimeout(resolve, 1500));
      const simulatedText = getSimulatedSummary(fileUrl);
      res.status(200).send({ summary: simulatedText, mode: 'simulated' });
      return;
    }

    // 1. Download the PDF file using native Node fetch
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch file from url (status ${response.status})`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const pdfBuffer = Buffer.from(arrayBuffer);

    // 2. Parse text content from PDF buffer
    const parsedData = await pdf(pdfBuffer);
    const extractedText = parsedData.text || '';

    if (!extractedText.trim()) {
      res.status(200).send({ 
        summary: '⚠️ The document appears to contain no readable text (it may be scanned or empty). Unable to generate summary.', 
        mode: 'live' 
      });
      return;
    }

    // Limit text size to prevent token limit issues
    const textSnippet = extractedText.substring(0, 12000);

    // 3. Query Google Gemini API
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `You are an expert academic summarizer. Please review the following lecture notes text and compile a concise, professional summary formatted nicely in Markdown with clear headings and bullet points:
    
    ---
    ${textSnippet}
    ---`;

    const result = await model.generateContent(prompt);
    const summaryText = result.response.text();

    res.status(200).send({ summary: summaryText, mode: 'live' });
  } catch (err: any) {
    console.error('Error in aiSummarizer Cloud Function:', err);
    res.status(500).send({ error: err.message || 'Failed to parse PDF and generate summary.' });
  }
});
