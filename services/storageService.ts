import { BloodRequest, AppConfig } from "../types";

const REQUESTS_KEY = "hayat_requests";
const CONFIG_KEY = "hayat_app_config";

export const getRequests = (): BloodRequest[] => {
  const data = localStorage.getItem(REQUESTS_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveRequest = (request: BloodRequest): void => {
  const requests = getRequests();
  requests.unshift(request); // Add to top
  localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
};

export const updateRequest = (updatedRequest: BloodRequest): void => {
  const requests = getRequests();
  const index = requests.findIndex((r) => r.id === updatedRequest.id);
  if (index !== -1) {
    requests[index] = updatedRequest;
    localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
  }
};

export const getAppConfig = (): AppConfig | null => {
  const data = localStorage.getItem(CONFIG_KEY);
  if (data) {
    return JSON.parse(data);
  }
  
  // Fallback for old key if exists
  const oldData = localStorage.getItem("hayat_telegram_config");
  if (oldData) {
      const parsed = JSON.parse(oldData);
      return {
          botToken: parsed.botToken || "",
          chatId: parsed.chatId || "",
          whatsappNumber: ""
      };
  }
  
  // Default Configuration requested by user
  return {
      botToken: "8329672546:AAGkrfyX5oNKtZHSYzRikNtCqLLYcgIV5pE",
      chatId: "-1003596982472",
      whatsappNumber: ""
  };
};

export const saveAppConfig = (config: AppConfig): void => {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
};