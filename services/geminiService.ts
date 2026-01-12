
import { GoogleGenAI, Type } from "@google/genai";
import { BloodRequest, UrgencyLevel, RequestSource, BloodRequestDetail } from "../types";

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Fix: Updated the return type to include suggestedMessage, as it is required by the BloodRequest.aiAnalysis interface.
export const analyzeRequest = async (
  description: string,
  bloodType: string,
  hospital: string,
  governorate: string,
  source: RequestSource,
  quantity: number = 1,
  requestDetails?: BloodRequestDetail[]
): Promise<{ urgency: UrgencyLevel; summary: string; suggestedMessage: string }> => {
  try {
    const model = "gemini-3-flash-preview";
    
    let bloodRequirements = "";
    if (requestDetails && requestDetails.length > 0) {
      bloodRequirements = requestDetails.map(d => `${d.quantity} units of ${d.bloodType}`).join(", ");
    } else {
      bloodRequirements = `${quantity} units of ${bloodType}`;
    }

    // Fix: Enhanced the prompt to request a suggested message for donors.
    const prompt = `
      Analyze this blood donation request for urgency and provide a brief internal summary and a suggested empathetic message in Arabic for potential donors.
      
      Details:
      - Source: ${source === RequestSource.HOSPITAL ? "Hospital" : "Individual"}
      - Location: ${governorate}, ${hospital}
      - Requirements: ${bloodRequirements}
      - Description: "${description}"

      Return:
      1. Urgency level: Low, Medium, High, Critical.
      2. A very short 1-sentence internal summary in Arabic for the admin dashboard.
      3. A suggested empathetic message in Arabic for potential donors.
    `;

    // Fix: Updated responseSchema to include suggestedMessage to ensure JSON parsing works correctly with the expected type.
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            urgency: {
              type: Type.STRING,
              enum: ["Low", "Medium", "High", "Critical"],
            },
            summary: {
              type: Type.STRING,
            },
            suggestedMessage: {
              type: Type.STRING,
            }
          },
          required: ["urgency", "summary", "suggestedMessage"],
        },
      },
    });

    const result = JSON.parse(response.text || "{}");
    
    let urgencyEnum = UrgencyLevel.MEDIUM;
    switch(result.urgency) {
        case "Low": urgencyEnum = UrgencyLevel.LOW; break;
        case "High": urgencyEnum = UrgencyLevel.HIGH; break;
        case "Critical": urgencyEnum = UrgencyLevel.CRITICAL; break;
    }

    // Fix: Return the full object required by the BloodRequest type.
    return {
      urgency: urgencyEnum,
      summary: result.summary || "تم استلام الطلب بنجاح",
      suggestedMessage: result.suggestedMessage || ""
    };

  } catch (error) {
    console.error("Gemini analysis failed:", error);
    // Fix: Return a consistent fallback object if the AI analysis fails.
    return {
      urgency: UrgencyLevel.MEDIUM,
      summary: "تحليل يدوي مطلوب",
      suggestedMessage: ""
    };
  }
};
