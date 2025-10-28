

import { GoogleGenAI, Type } from "@google/genai";
import { TreeCondition, type TreeAnalysisResult } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    species: {
      type: Type.STRING,
      description: "Nama ilmiah atau umum dari spesies pohon.",
    },
    latitude: {
      type: Type.NUMBER,
      description: "Koordinat lintang pohon, diekstrak dari tanda GPS visual pada foto. Kembalikan 0 jika tidak ditemukan.",
    },
    longitude: {
      type: Type.NUMBER,
      description: "Koordinat bujur pohon, diekstrak dari tanda GPS visual pada foto. Kembalikan 0 jika tidak ditemukan.",
    },
    condition: {
      type: Type.STRING,
      enum: [TreeCondition.HEALTHY, TreeCondition.DAMAGED, TreeCondition.DEAD],
      description: "Kondisi kesehatan pohon.",
    },
    estimatedDbh: {
      type: Type.NUMBER,
      description: "Estimasi Diameter Setinggi Dada (DBH) pohon dalam sentimeter. Kembalikan 0 jika tidak memungkinkan untuk diestimasi.",
    },
    estimatedHeight: {
      type: Type.NUMBER,
      description: "Estimasi tinggi total pohon dalam meter. Kembalikan 0 jika tidak memungkinkan untuk diestimasi.",
    }
  },
  required: ["species", "latitude", "longitude", "condition", "estimatedDbh", "estimatedHeight"],
};


export const analyzeTreeImage = async (base64Image: string, userNotes: string): Promise<TreeAnalysisResult> => {
  const prompt = `Analisis gambar pohon yang diberikan. Identifikasi spesies, kondisi, dan estimasikan DBH (cm) serta tingginya (m). 
  Yang terpenting, periksa gambar untuk teks watermark atau teks tersemat yang menunjukkan koordinat GPS (lintang dan bujur) karena ini adalah praktik umum untuk foto lapangan.
  Jika pengguna memberikan catatan, anggap itu sebagai konteks tambahan.
  Catatan pengguna: "${userNotes || 'Tidak ada catatan yang diberikan.'}"
  
  Berikan respons Anda dalam format JSON terstruktur. Jika Anda tidak dapat menentukan suatu nilai, gunakan nilai default yang masuk akal (misalnya, 0 untuk nilai numerik, 'Tidak Diketahui' untuk spesies).
  `;

  const imagePart = {
    inlineData: {
      data: base64Image,
      mimeType: 'image/jpeg'
    }
  };

  const textPart = {
    text: prompt
  };

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts: [imagePart, textPart] },
    config: {
      responseMimeType: "application/json",
      responseSchema: responseSchema,
    }
  });

  const jsonString = response.text.trim();
  const parsedResult = JSON.parse(jsonString);
  
  // Validate and return with the correct enum type
  return {
    ...parsedResult,
    condition: Object.values(TreeCondition).includes(parsedResult.condition) ? parsedResult.condition : TreeCondition.HEALTHY
  };
};
