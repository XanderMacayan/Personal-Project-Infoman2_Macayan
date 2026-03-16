'use server';
/**
 * @fileOverview This file implements an AI-powered tool to summarize visitor trends,
 * identify unusual patterns, and highlight significant changes in library usage.
 *
 * - aiVisitorTrendSummary - A function that handles the visitor trend summarization process.
 * - AiVisitorTrendSummaryInput - The input type for the aiVisitorTrendSummary function.
 * - AiVisitorTrendSummaryOutput - The return type for the aiVisitorTrendSummary function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const VisitorEntrySchema = z.object({
  date: z.string().describe('Date of the visit in YYYY-MM-DD format.'),
  time: z.string().describe('Time of the visit in HH:MM format (24-hour).'),
  purpose: z
    .string()
    .describe('Purpose of the visit (e.g., reading books, research in thesis, use of computer, doing assignments).'),
  college: z.string().describe('College or department the visitor belongs to.'),
  isEmployee: z.boolean().describe('True if the visitor is an employee (faculty or staff), false otherwise.'),
});

const AiVisitorTrendSummaryInputSchema = z.object({
  visitorLogs: z
    .array(VisitorEntrySchema)
    .describe('An array of historical visitor log entries.'),
});
export type AiVisitorTrendSummaryInput = z.infer<typeof AiVisitorTrendSummaryInputSchema>;

const AiVisitorTrendSummaryOutputSchema = z.object({
  summary: z.string().describe('A concise summary of overall visitor trends, including peak times, popular purposes, and demographic insights.'),
  unusualPatterns: z.string().describe('Identification of any unusual or anomalous patterns in visitor data, such as unexpected spikes or drops in visits, or unusual purpose distributions.'),
  significantChanges: z.string().describe('Description of significant changes in library usage over time, e.g., changes in daily/weekly/monthly averages, or shifts in user demographics.'),
  recommendations: z.string().optional().describe('Optional recommendations based on the analyzed trends and patterns to optimize library operations or services.'),
});
export type AiVisitorTrendSummaryOutput = z.infer<typeof AiVisitorTrendSummaryOutputSchema>;

export async function aiVisitorTrendSummary(input: AiVisitorTrendSummaryInput): Promise<AiVisitorTrendSummaryOutput> {
  return aiVisitorTrendSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiVisitorTrendSummaryPrompt',
  input: { schema: AiVisitorTrendSummaryInputSchema },
  output: { schema: AiVisitorTrendSummaryOutputSchema },
  prompt: `You are an AI assistant specialized in analyzing library visitor data.
Your task is to review the provided visitor logs and generate a comprehensive summary of trends,
identify any unusual patterns, and highlight significant changes in library usage.

Analyze the following visitor log data:

<visitor_logs>
{{{JSON.stringify visitorLogs}}}
</visitor_logs>

Based on this data, provide:
1. A concise summary of overall visitor trends.
2. Any unusual or anomalous patterns observed.
3. Significant changes in library usage over time.
4. Optional recommendations to optimize library operations or services.

Ensure your output strictly adheres to the JSON schema provided for AiVisitorTrendSummaryOutput.`,
});

const aiVisitorTrendSummaryFlow = ai.defineFlow(
  {
    name: 'aiVisitorTrendSummaryFlow',
    inputSchema: AiVisitorTrendSummaryInputSchema,
    outputSchema: AiVisitorTrendSummaryOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
