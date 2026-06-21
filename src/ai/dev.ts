'use client';
import { config } from 'dotenv';
config();

import '@/ai/flows/extract-cheque-data.ts';
import '@/ai/flows/extract-invoice-data.ts';
import '@/ai/flows/generate-executive-summary.ts';
