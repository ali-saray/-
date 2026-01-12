import React, { useState, useEffect } from "react";
import { getRequests, updateRequest, getAppConfig } from "../services/storageService";
import { BloodRequest, RequestStatus, UrgencyLevel, RequestSource } from "../types";
import { sendToTelegram } from "../services/telegramService";
import { constructMessage } from "../services/messageUtils";
import { 
  Send, 
  CheckCircle, 
  Clock, 
  Settings, 
  RefreshCw,
  Lock,
  Building2,
  User,
  ShieldCheck,
  MessageCircle,
  AlertTriangle
} from "lucide-react";
import { TelegramConfigModal } from "../components/TelegramConfigModal";

export const AdminPage: React.FC = () => {
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const refreshData = () => {
    setRequests(getRequests());
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === "1234") { // Simple hardcoded PIN
      setIsAuthenticated(true);
      setError("");
    } else {
      setError("رمز الدخول غير صحيح");
    }
  };

  const handleSendToTelegram = async (request: BloodRequest) => {
    const config = getAppConfig();
    
    if (!config || !config.botToken || !config.chatId) {
      alert("يرجى ضبط إعدادات التلكرام أولاً");
      setIsConfigOpen(true);
      return;
    }

    setSendingId(request.id);
    const message = constructMessage(request);
    
    // We expect { success: boolean, error?: string } from new service signature
    const result = await sendToTelegram(message, config);

    if (result.success) {
      const updated = { ...request, status: RequestStatus.SENT_TO_TELEGRAM };
      updateRequest(updated);
      refreshData();
      // Optional: Add a small toast notification here
    } else {
      alert(`فشل الإرسال: ${result.error}\n\nتأكد من صحة التوكن و Chat ID، وأن البوت مشرف في القناة.`);
    }
    setSendingId(null);
  };

  const handleShareWhatsApp = (request: BloodRequest) => {
      const config = getAppConfig();
      const message = constructMessage(request);
      // Remove markdown asterisks for WhatsApp readability if needed, though WhatsApp supports them.
      
      let url = "";
      // If a specific admin/group number is configured, send to THEM
      if (config && config.whatsappNumber) {
          url = `https://wa.me/${config.whatsappNumber}?text=${encodeURIComponent(message)}`;
      } else {
          // Otherwise, open contact picker
          url = `https://wa.me/?text=${encodeURIComponent(message)}`;
      }
      
      window.open(url, '_blank');
  };

  const markFulfilled = (request: BloodRequest) => {
    const updated = { ...request, status: RequestStatus.FULFILLED };
    updateRequest(updated);
    refreshData();
  };

  const getUrgencyColor = (urgency?: UrgencyLevel) => {
    switch (urgency) {
      case UrgencyLevel.CRITICAL: return "bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800";
      case UrgencyLevel.HIGH: return "bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-800";
      case UrgencyLevel.MEDIUM: return "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800";
      default: return "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800";
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="bg-white dark:bg-navy-900 p-8 rounded-3xl shadow-2xl w-full max-w-sm border border-gray-100 dark:border-navy-800 text-center">
            <div className="bg-gray-100 dark:bg-navy-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Lock className="w-8 h-8 text-gray-500 dark:text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">دخول المشرفين</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">أدخل رمز المرور للوصول للوحة التحكم (1234)</p>
            
            <form onSubmit={handleLogin} className="space-y-4">
                <input 
                    type="password" 
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="رمز الدخول"
                    className="w-full text-center text-2xl tracking-widest px-4 py-3 rounded-xl bg-gray-50 dark:bg-navy-950 border-gray-200 dark:border-navy-800 border focus:bg-white dark:focus:bg-navy-900 focus:ring-2 focus:ring-zinc-500 outline-none dark:text-white transition-all"
                    autoFocus
                />
                {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
                <button 
                    type="submit"
                    className="w-full bg-zinc-900 hover:bg-black text-white font-bold py-3 rounded-xl transition-all"
                >
                    دخول
                </button>
            </form>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            لوحة التحكم
            <ShieldCheck className="text-zinc-900 dark:text-zinc-100" size={24} />
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">إدارة طلبات الدم وحالة النشر</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={refreshData} 
            className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-800 rounded-full transition-colors"
          >
            <RefreshCw size={20} />
          </button>
          <button
            onClick={() => setIsConfigOpen(true)}
            className="flex items-center gap-2 bg-white dark:bg-navy-800 border border-gray-300 dark:border-navy-700 hover:bg-gray-50 dark:hover:bg-navy-700 text-gray-700 dark:text-white px-4 py-2 rounded-xl font-medium transition-colors shadow-sm"
          >
            <Settings size={18} />
            <span>إعدادات الإشعارات</span>
          </button>
        </div>
      </div>

      <TelegramConfigModal isOpen={isConfigOpen} onClose={() => setIsConfigOpen(false)} />

      {requests.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-navy-900 rounded-3xl border border-dashed border-gray-300 dark:border-navy-800">
          <div className="bg-gray-50 dark:bg-navy-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="text-gray-400" size={32} />
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-lg">لا توجد طلبات دم حالياً</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {requests.map((request) => (
            <div
              key={request.id}
              className={`bg-white dark:bg-navy-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-navy-800 hover:shadow-md transition-shadow relative overflow-hidden group ${
                request.status === RequestStatus.FULFILLED ? 'opacity-60 grayscale-[50%]' : ''
              }`}
            >
               {/* Urgency Stripe */}
               <div className={`absolute top-0 right-0 w-1.5 h-full ${
                  request.aiAnalysis?.urgency === UrgencyLevel.CRITICAL ? 'bg-red-600' : 
                  request.aiAnalysis?.urgency === UrgencyLevel.HIGH ? 'bg-orange-500' : 'bg-green-500'
               }`} />

              <div className="flex flex-col lg:flex-row justify-between gap-6">
                
                {/* Left Side: Info */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                             {request.source === RequestSource.HOSPITAL ? (
                                <span className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-zinc-600 bg-zinc-100 dark:bg-zinc-900/40 dark:text-zinc-300 px-2 py-0.5 rounded-full">
                                    <Building2 size={10} /> مستشفى
                                </span>
                             ) : (
                                <span className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-300 px-2 py-0.5 rounded-full">
                                    <User size={10} /> فرد
                                </span>
                             )}
                        </div>
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                             {/* Display multiple types if present, otherwise single type */}
                             {request.requestDetails && request.requestDetails.length > 0 ? (
                                <div className="flex gap-2 flex-wrap">
                                    {request.requestDetails.map((d, idx) => (
                                        <span key={idx} className="flex items-center text-lg font-bold text-gray-800 dark:text-white bg-gray-100 dark:bg-navy-800 px-2 py-1 rounded-lg border border-gray-200 dark:border-navy-700">
                                            <span className="text-red-600 dark:text-red-400 mr-1">{d.bloodType}</span>
                                            <span className="text-sm text-gray-500 dark:text-gray-400">x{d.quantity}</span>
                                        </span>
                                    ))}
                                </div>
                             ) : (
                                <>
                                    <span className="text-2xl font-black text-red-600 dark:text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded-lg border border-red-100 dark:border-red-900/50">
                                        {request.bloodType}
                                    </span>
                                    {request.quantity && request.quantity > 1 && (
                                        <span className="text-sm font-medium text-red-500">
                                            مطلوب: {request.quantity} كيس
                                        </span>
                                    )}
                                </>
                             )}
                             
                             <div>
                                <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                                    {request.patientName}
                                </h3>
                             </div>
                        </div>
                        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
                            <Clock size={14} />
                            <span>{new Date(request.createdAt).toLocaleString('ar-EG')}</span>
                        </div>
                    </div>
                    
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getUrgencyColor(request.aiAnalysis?.urgency)}`}>
                        أولوية: {request.aiAnalysis?.urgency || "Unknown"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-navy-950 p-4 rounded-xl">
                      <div>
                          <span className="text-xs text-gray-500 dark:text-gray-400 block">المستشفى</span>
                          <span className="font-semibold text-gray-800 dark:text-gray-200">{request.hospitalName}</span>
                      </div>
                      <div>
                          <span className="text-xs text-gray-500 dark:text-gray-400 block">المحافظة</span>
                          <span className="font-semibold text-gray-800 dark:text-gray-200">{request.governorate || "الديوانية"}</span>
                      </div>
                      <div>
                          <span className="text-xs text-gray-500 dark:text-gray-400 block">رقم الهاتف</span>
                          <span className="font-semibold text-gray-800 dark:text-gray-200 dir-ltr text-right">{request.contactNumber}</span>
                      </div>
                      <div className="col-span-1 md:col-span-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400 block">تحليل الذكاء الاصطناعي</span>
                          <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 italic leading-relaxed">
                            "{request.aiAnalysis?.summary}"
                          </p>
                      </div>
                  </div>
                </div>

                {/* Right Side: Actions */}
                <div className="flex flex-row lg:flex-col gap-3 justify-center lg:w-48 shrink-0 border-t lg:border-t-0 lg:border-r border-gray-100 dark:border-navy-800 pt-4 lg:pt-0 lg:pr-6">
                  
                  {request.status !== RequestStatus.FULFILLED && (
                    <>
                        <button
                        onClick={() => handleSendToTelegram(request)}
                        disabled={sendingId === request.id || request.status === RequestStatus.SENT_TO_TELEGRAM}
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl font-bold text-sm transition-all ${
                            request.status === RequestStatus.SENT_TO_TELEGRAM
                            ? "bg-zinc-100 dark:bg-zinc-900/30 text-zinc-700 dark:text-zinc-300 cursor-default"
                            : "bg-zinc-900 hover:bg-black text-white shadow-lg shadow-zinc-600/20"
                        }`}
                        >
                            {sendingId === request.id ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : request.status === RequestStatus.SENT_TO_TELEGRAM ? (
                                <>
                                    <CheckCircle size={16} />
                                    تلكرام
                                </>
                            ) : (
                                <>
                                    <Send size={16} />
                                    تلكرام
                                </>
                            )}
                        </button>
                        
                        <button
                            onClick={() => handleShareWhatsApp(request)}
                            className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-xl font-bold text-sm transition-colors shadow-lg shadow-green-600/20"
                        >
                            <MessageCircle size={16} />
                            واتساب
                        </button>
                    </>
                  )}

                  {request.status !== RequestStatus.FULFILLED ? (
                      <button 
                        onClick={() => markFulfilled(request)}
                        className="flex-1 flex items-center justify-center gap-2 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 text-green-700 dark:text-green-400 px-3 py-2 rounded-xl font-bold text-sm transition-colors"
                      >
                        <CheckCircle size={16} />
                        تم
                      </button>
                  ) : (
                      <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400 font-bold bg-green-50 dark:bg-green-900/20 px-3 py-3 rounded-xl">
                          <CheckCircle size={18} />
                          مكتمل
                      </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};