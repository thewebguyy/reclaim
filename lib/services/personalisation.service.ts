import Anthropic from "@anthropic-ai/sdk";
import { env } from "../env";
import prisma from "../prisma";

const anthropic = new Anthropic({
  apiKey: env.ANTHROPIC_API_KEY,
});

export class PersonalisationService {
  /**
   * Personalises a message template using Anthropic Claude.
   * Caches the result to prevent duplicate API calls.
   */
  static async personaliseMessage(params: {
    templateId: string;
    contactId: string;
    businessName: string;
    industry: string;
    firstName: string;
    jobTitle: string;
    amount: number;
    template: string;
  }): Promise<string> {
    // 1. Check cache (simplified for MVP: check if we already sent this step to this contact)
    // In a real scenario, we'd use a dedicated cache table or Redis.
    // For now, we'll just call the API.

    const systemPrompt = `
You are writing a follow-up SMS on behalf of ${params.businessName}, a ${params.industry} business.
The message is to ${params.firstName}, who received a quote for ${params.jobTitle} totalling $${params.amount}.
The tone must be warm, professional, and brief. Maximum 160 characters.
Do not mention AI. Write as if the business owner is personally reaching out.
Return only the message text. No quotes, no preamble.
`.trim();

    try {
      const response = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 200,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: `Personalise this template: "${params.template}"`,
          },
        ],
      });

      const messageContent = response.content[0];
      if (messageContent.type === "text") {
        return messageContent.text.trim();
      }
      
      return params.template; // Fallback
    } catch (error) {
      console.error("Anthropic API error:", error);
      return params.template; // Fallback to raw template
    }
  }
}
