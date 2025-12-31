
import { GoogleGenAI } from "@google/genai";

export const geminiService = {
  /**
   * Generates a professional press release summary for a Wushu tournament
   */
  async generateTournamentSummary(title: string, description: string) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Write a professional, inspiring press release summary for a Wushu tournament titled "${title}" with the following context: ${description}. Keep it under 150 words. Mention Wushu Sanda and Taolu traditions.`
      });
      return response.text || "An exciting upcoming Wushu event showcasing the best talent in Srinagar.";
    } catch (error: any) {
      console.warn("AI summary generation skipped:", error?.message);
      return "The District Wushu Association Srinagar is proud to host this upcoming championship, bringing together the finest Sanda and Taolu athletes.";
    }
  },

  /**
   * Provides deep strategic analysis using Thinking Mode (Gemini 3 Pro)
   * Instructions: gemini-3-pro-preview, thinkingBudget: 32768, no maxOutputTokens.
   */
  async getComplexAnalysis(query: string, context: any) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Context: ${JSON.stringify(context)}\n\nUser Query: ${query}\n\nAs an expert Wushu Association Advisor, provide a deeply reasoned, strategic response. Think through the logistics, regulations, and athletic development aspects carefully.`,
        config: {
          thinkingConfig: { thinkingBudget: 32768 }
        }
      });
      return response.text;
    } catch (error: any) {
      console.error("Complex analysis failed:", error);
      return "The strategic core is currently under maintenance. Please try again shortly.";
    }
  }
};
