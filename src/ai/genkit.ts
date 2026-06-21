import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: process.env.GEMINI_API_KEY ? [googleAI()] : [],
  model: 'googleai/gemini-2.5-flash',
});
