import { AppConfig } from "../types";

export const sendToTelegram = async (
  message: string,
  config: AppConfig
): Promise<{ success: boolean; error?: string }> => {
  if (!config.botToken || !config.chatId) {
      return { success: false, error: "Missing Bot Token or Chat ID" };
  }

  const url = `https://api.telegram.org/bot${config.botToken}/sendMessage`;

  const sendMessage = async (parseMode?: string) => {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: config.chatId,
          text: message,
          parse_mode: parseMode,
        }),
      });
      const data = await response.json();
      return { ok: response.ok, data };
  };

  try {
      // 1. First attempt: Send with Markdown to preserve formatting (Bold, etc.)
      let result = await sendMessage("Markdown");

      // 2. If it fails specifically due to Markdown parsing (e.g., unclosed * or _), retry as Plain Text
      if (!result.ok && result.data.description && result.data.description.includes("can't parse entities")) {
          console.warn("Telegram Markdown parsing failed, retrying as plain text.");
          result = await sendMessage(undefined); // undefined means no parse_mode (Plain Text)
      }

      // 3. If it still fails, return the error
      if (!result.ok) {
           console.error("Telegram API Error:", result.data);
           return { 
               success: false, 
               error: `Telegram Error: ${result.data.description || "Unknown error"}` 
           };
      }

      return { success: true };

  } catch (error) {
      console.error("Telegram Service Network/CORS Error:", error);
      return { 
          success: false, 
          error: "فشل الاتصال. قد يكون السبب هو المتصفح (CORS) أو مشكلة في الإنترنت." 
      };
  }
};