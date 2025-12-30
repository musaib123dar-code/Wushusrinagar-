
import { GoogleGenAI } from "@google/genai";

// We initialize the client inside the methods to ensure the latest API key is used
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
      // Log more detailed info but provide a clean fallback
      console.warn("AI summary generation skipped due to service availability:", error?.message);
      return "The District Wushu Association Srinagar is proud to host this upcoming championship, bringing together the finest Sanda and Taolu athletes for a display of skill, discipline, and sportsmanship.";
    }
  },

  /**
   * Provides motivational coaching feedback based on player performance statistics
   */
  async analyzePerformance(stats: any) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze these Wushu player stats: ${JSON.stringify(stats)}. Provide a short motivational feedback for the player.`
      });
      return response.text || "Keep training hard and master your forms!";
    } catch (error) {
      return "Your dedication to the art of Wushu is inspiring. Focus on your daily drills and the results will follow. Stay strong!";
    }
  }
};
