import React, { useState, useEffect } from "react";
import { X, Save, MessageCircle, Smartphone } from "lucide-react";
import { getAppConfig, saveAppConfig } from "../services/storageService";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const TelegramConfigModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [botToken, setBotToken] = useState("");
  const [chatId, setChatId] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");

  useEffect(() => {
    if (isOpen) {
      const config = getAppConfig();
      if (config) {
        setBotToken(config.botToken || "");
        setChatId(config.chatId || "");
        setWhatsappNumber(config.whatsappNumber || "");
      }
    }
  }, [isOpen]);

  const handleSave = () => {
    saveAppConfig({ botToken, chatId, whatsappNumber });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-slate-800">
        <div className="bg-gray-50 dark:bg-slate-800 px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
          <h3 className="font-bold text-lg text-gray-800 dark:text-white flex items-center gap-2">
            <MessageCircle className="text-zinc-900 dark:text-zinc-100" />
            إعدادات الإشعارات
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Telegram Section */}
          <div className="space-y-3">
             <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200 font-medium text-sm">
                <MessageCircle size={16} />
                <span>إعدادات تلكرام (Telegram)</span>
             </div>
             
             <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Bot Token
                </label>
                <input
                  type="text"
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                  placeholder="123456789:ABCdefGHI..."
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-zinc-500 outline-none transition-all dir-ltr text-left dark:text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Chat ID (@ChannelName or ID)
                </label>
                <input
                  type="text"
                  value={chatId}
                  onChange={(e) => setChatId(e.target.value)}
                  placeholder="@my_blood_channel"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-zinc-500 outline-none transition-all dir-ltr text-left dark:text-white text-sm"
                />
              </div>
          </div>
          
          <hr className="border-gray-100 dark:border-slate-700" />

          {/* WhatsApp Section */}
          <div className="space-y-3">
             <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-medium text-sm">
                <Smartphone size={16} />
                <span>إعدادات واتساب (WhatsApp)</span>
             </div>
             <p className="text-xs text-gray-400">
                حدد رقم هاتف (مع المفتاح الدولي) لإرسال الإشعارات إليه مباشرة عند الضغط على زر واتساب.
             </p>
             <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  رقم المستقبل (اختياري)
                </label>
                <input
                  type="text"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="9647xxxxxxxxx"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-green-500 outline-none transition-all dir-ltr text-left dark:text-white text-sm"
                />
             </div>
          </div>

        </div>

        <div className="px-6 py-4 bg-gray-50 dark:bg-slate-800 flex justify-end">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 bg-zinc-900 hover:bg-black text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-lg shadow-zinc-600/20"
          >
            <Save size={18} />
            حفظ الإعدادات
          </button>
        </div>
      </div>
    </div>
  );
};