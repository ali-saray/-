import React, { useState } from "react";
import QRCode from "react-qr-code";
import { X, Copy, Check, Share2 } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ShareAppModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  
  // Get the current base URL (e.g., domain.com or localhost:port)
  const appUrl = window.location.origin + window.location.pathname;

  const handleCopy = () => {
    navigator.clipboard.writeText(appUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-gray-100 dark:border-slate-800 relative">
        
        {/* Header */}
        <div className="bg-gray-50 dark:bg-slate-800 px-6 py-4 flex justify-between items-center border-b border-gray-100 dark:border-slate-700">
          <h3 className="font-bold text-lg text-gray-800 dark:text-white flex items-center gap-2">
            <Share2 className="text-red-600" size={20} />
            مشاركة التطبيق
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors bg-white dark:bg-slate-700 p-1 rounded-full shadow-sm"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 flex flex-col items-center justify-center space-y-6">
          <div className="bg-white p-4 rounded-xl shadow-inner border border-gray-100">
            <QRCode 
              value={appUrl} 
              size={200}
              viewBox={`0 0 256 256`}
              className="w-full h-auto max-w-[200px]"
            />
          </div>
          
          <div className="text-center space-y-1">
            <p className="font-bold text-gray-800 dark:text-white text-lg">امسح الرمز للدخول</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              وجه كاميرا الهاتف نحو الرمز لفتح الموقع مباشرة
            </p>
          </div>

          {/* Copy Link Section */}
          <div className="w-full flex items-center gap-2 bg-gray-50 dark:bg-slate-950 p-3 rounded-xl border border-gray-200 dark:border-slate-800">
             <div className="flex-1 overflow-hidden">
                <p className="text-xs text-gray-500 truncate font-mono dir-ltr text-left">
                    {appUrl}
                </p>
             </div>
             <button 
                onClick={handleCopy}
                className={`p-2 rounded-lg transition-all ${copied ? 'bg-green-100 text-green-600' : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:text-blue-600 shadow-sm'}`}
             >
                {copied ? <Check size={16} /> : <Copy size={16} />}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};