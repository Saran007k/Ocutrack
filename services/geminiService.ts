
import { GoogleGenAI, Type, GenerateContentResponse, Modality } from "@google/genai";
import { Medication, MedType } from "../types.ts";

// Note: process.env.API_KEY is pre-configured.
const API_KEY = process.env.API_KEY || '';

export const getGeminiClient = () => {
  return new GoogleGenAI({ apiKey: API_KEY });
};

/**
 * Uses Gemini Pro Vision to extract medication details from a photo of a label.
 */
export async function analyzeMedicationLabel(base64Image: string): Promise<Partial<Medication> | null> {
  const ai = getGeminiClient();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          { inlineData: { data: base64Image, mimeType: 'image/jpeg' } },
          { text: "Extract medication details from this eye drop or tablet bottle. Return JSON: { name, type: 'DROPS'|'TABLET', dosage, frequency (int per day), eye: 'Left'|'Right'|'Both' }. If not clear, guess or leave blank." }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            type: { type: Type.STRING },
            dosage: { type: Type.STRING },
            frequency: { type: Type.INTEGER },
            eye: { type: Type.STRING }
          }
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Error analyzing label:", error);
    return null;
  }
}

/**
 * Uses Gemini with Google Search to check for side effects or general info.
 */
export async function getMedicalSearchInfo(query: string) {
  const ai = getGeminiClient();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Provide patient-friendly medical information about: ${query}. Focus on eye safety.`,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: "You are a professional medical assistant. Provide clear, simple, and safe information for elderly patients. Always mention that this is for information only and they should consult a doctor."
      },
    });

    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    return {
      text: response.text,
      sources: sources.map((chunk: any) => ({
        title: chunk.web?.title || 'Source',
        url: chunk.web?.uri || '#'
      }))
    };
  } catch (error) {
    console.error("Error with search grounding:", error);
    return { text: "I'm sorry, I couldn't find up-to-date information right now.", sources: [] };
  }
}

/**
 * Text to Speech for the schedule.
 */
export async function speakSchedule(text: string) {
  const ai = getGeminiClient();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const binaryString = atob(base64Audio);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const dataInt16 = new Int16Array(bytes.buffer);
      const frameCount = dataInt16.length;
      const buffer = audioContext.createBuffer(1, frameCount, 24000);
      const channelData = buffer.getChannelData(0);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i] / 32768.0;
      }

      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.destination);
      source.start();
    }
  } catch (error) {
    console.error("TTS Error:", error);
  }
}
