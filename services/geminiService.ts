
import { GoogleGenAI, Type } from "@google/genai";

const API_KEY = process.env.API_KEY || "";

export const analyzeDocument = async (title: string, description: string) => {
  if (!API_KEY) return "AI Summary unavailable (No API Key)";

  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analisislah dokumen Kekayaan Intelektual berikut dan berikan ringkasan singkat (maksimal 2 kalimat) serta kategorisasi yang tepat berdasarkan jenis arsip DJKI (Sertifikat, Kutipan, Permohonan, Sanggahan, atau Tolakan).
      
      Judul: ${title}
      Deskripsi: ${description}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            suggestedCategory: { type: Type.STRING },
          },
          required: ["summary", "suggestedCategory"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return { summary: "Gagal menganalisis dokumen.", suggestedCategory: "Lainnya" };
  }
};
