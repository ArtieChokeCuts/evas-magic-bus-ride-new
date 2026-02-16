
import { GoogleGenAI, Modality } from "@google/genai";

const getApiKey = () => {
  try {
    return process.env.API_KEY;
  } catch (e) {
    console.warn("process.env.API_KEY is not accessible.");
    return "";
  }
};

const ai = new GoogleGenAI({ apiKey: getApiKey() });

export const getMagicalCompliment = async (name, level, type) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a super short, magical, and encouraging 1-sentence compliment for a child named ${name} who just reached level ${level} in ${type}. Keep it fun and use emojis. Use a tone of a friendly magical fairy.`,
      config: {
        temperature: 0.9,
      }
    });
    return response.text || "You are doing amazing!";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Keep going, you're a superstar!";
  }
};

export const generateMagicalSpeech = async (text) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Say this magically and cheerfully: ${text}` }] }],
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
    return base64Audio;
  } catch (error) {
    console.error("Gemini TTS Error:", error);
    return null;
  }
};

export function decodeBase64(base64) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data,
  ctx,
  sampleRate,
  numChannels,
) {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
