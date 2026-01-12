import React, { useState } from "react";
import { BloodType, BloodRequest, RequestStatus, RequestSource } from "../types";
import { saveRequest, getAppConfig } from "../services/storageService";
import { analyzeRequest } from "../services/geminiService";
import { constructMessage } from "../services/messageUtils";
import { sendToTelegram } from "../services/telegramService";
import { Loader2, Send, AlertCircle, Droplet, User, Phone, MapPin, FileText, Navigation, Building2 } from "lucide-react";
import { v4 as uuidv4 } from 'uuid';

const DIWANIYAH_HOSPITALS = [
  "مستشفى الديوانية التعليمي",
  "مستشفى النسائية والأطفال التعليمي",
  "مستشفى الشامية العام",
  "مستشفى عفك العام",
  "مستشفى الحمزة العام",
  "مستشفى الرميثة العام"
];

export const RequestPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [sentToTelegram, setSentToTelegram] = useState(false);
  
  const [formData, setFormData] = useState({
    patientName: "",
    bloodType: BloodType.O_POS,
    hospitalName: "",
    governorate: "الديوانية", // Fixed value
    contactNumber: "",
    description: "",
  });

  const validatePhone = (phone: string) => {
    // Regex for Iraqi mobile numbers: Starts with 07 followed by 9 digits (11 total)
    const iraqiPhoneRegex = /^07\d{9}$/;
    return iraqiPhoneRegex.test(phone);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Allow only numbers
    if (val === "" || /^\d+$/.test(val)) {
        setFormData({ ...formData, contactNumber: val });
        if (val.length > 0 && !/^07\d{9}$/.test(val)) {
             if(val.length === 11) {
                 // Check format only when length is reached
                 if(!val.startsWith("07")) setPhoneError("يجب أن يبدأ الرقم بـ 07");
                 else setPhoneError("");
             } else if (val.length > 11) {
                 setPhoneError("الرقم طويل جداً");
             } else {
                 setPhoneError("");
             }
        } else {
            setPhoneError("");
        }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePhone(formData.contactNumber)) {
        setPhoneError("يرجى إدخال رقم عراقي صحيح (07xxxxxxxxx)");
        return;
    }

    if (!formData.hospitalName) {
      alert("يرجى اختيار المستشفى");
      return;
    }

    // Prepare WhatsApp window immediately to bypass popup blockers
    const config = getAppConfig();
    let waWindow: Window | null = null;
    if (config && config.whatsappNumber) {
        waWindow = window.open('', '_blank');
        if (waWindow) {
            waWindow.document.write(`
                <html dir="rtl">
                    <body style="font-family: sans-serif; text-align: center; padding: 40px; background-color: #f0fdf4;">
                        <h2 style="color: #166534;">جاري تحضير رسالة واتساب...</h2>
                        <p>يرجى الانتظار قليلاً بينما يقوم الذكاء الاصطناعي بتحليل طلبك.</p>
                        <div style="margin-top: 20px; font-size: 24px;">⏳</div>
                    </body>
                </html>
            `);
        }
    }

    setLoading(true);

    try {
      const source = RequestSource.INDIVIDUAL;

      // 1. Analyze with AI
      const aiAnalysis = await analyzeRequest(
        formData.description,
        formData.bloodType,
        formData.hospitalName,
        formData.governorate,
        source
      );

      // 2. Create Object
      const newRequest: BloodRequest = {
        id: uuidv4(),
        ...formData,
        source,
        quantity: 1, // Default for individuals
        aiAnalysis,
        status: RequestStatus.PENDING,
        createdAt: Date.now(),
      };

      // 3. Auto-Send to Telegram (Background API Call)
      if (config && config.botToken && config.chatId) {
          const msg = constructMessage(newRequest);
          const telegramResult = await sendToTelegram(msg, config);
          if (telegramResult.success) {
              newRequest.status = RequestStatus.SENT_TO_TELEGRAM;
              setSentToTelegram(true);
          } else {
              console.error("Failed to auto-send to Telegram:", telegramResult.error);
          }
      }

      // 4. Save to local storage
      saveRequest(newRequest);
      
      // 5. Redirect WhatsApp Window (if configured)
      if (waWindow && config && config.whatsappNumber) {
          const msg = constructMessage(newRequest);
          const url = `https://wa.me/${config.whatsappNumber}?text=${encodeURIComponent(msg)}`;
          waWindow.location.href = url;
      }

      setSuccess(true);
      setFormData({
        patientName: "",
        bloodType: BloodType.O_POS,
        hospitalName: "",
        governorate: "الديوانية",
        contactNumber: "",
        description: "",
      });
    } catch (error) {
      console.error(error);
      if (waWindow) waWindow.close(); // Close if failed
      alert("حدث خطأ أثناء إرسال الطلب");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center p-6 animate-in fade-in zoom-in duration-300">
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
            <Send className="text-green-600 dark:text-green-400 w-10 h-10" />
        </div>
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">تم استلام طلبك بنجاح</h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8 space-y-2">
          <span className="block">سيتم مراجعة طلبك من قبل المشرفين.</span>
          {sentToTelegram && (
             <span className="block text-green-600 font-medium">✅ تم نشر الطلب تلقائياً في قناة التلكرام.</span>
          )}
          {getAppConfig()?.whatsappNumber && (
             <span className="block text-green-600 font-medium">✅ تم فتح واتساب لإرسال التفاصيل للمنسق.</span>
          )}
        </p>
        <button
          onClick={() => {
            setSuccess(false);
            setSentToTelegram(false);
          }}
          className="text-red-600 dark:text-red-400 font-medium hover:text-red-700 dark:hover:text-red-300 underline"
        >
          تقديم طلب آخر
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">طلب وحدة دم (للأفراد)</h1>
        <p className="text-gray-500 dark:text-gray-400">
          املأ النموذج أدناه لطلب التبرع لمريض محدد. 
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-navy-900 rounded-2xl shadow-xl dark:shadow-none dark:border dark:border-navy-800 p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <User size={16} />
              اسم المريض
            </label>
            <input
              required
              type="text"
              className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-navy-950 border-gray-200 dark:border-navy-800 border focus:bg-white dark:focus:bg-navy-900 focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:text-white outline-none transition-all"
              placeholder="الاسم الثلاثي"
              value={formData.patientName}
              onChange={(e) =>
                setFormData({ ...formData, patientName: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <Droplet size={16} />
              فصيلة الدم
            </label>
            <div className="relative">
              <select
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-navy-950 border-gray-200 dark:border-navy-800 border focus:bg-white dark:focus:bg-navy-900 focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:text-white outline-none transition-all appearance-none"
                value={formData.bloodType}
                onChange={(e) =>
                  setFormData({ ...formData, bloodType: e.target.value as BloodType })
                }
              >
                {Object.values(BloodType).map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <Droplet className="absolute left-3 top-3.5 text-red-500 pointer-events-none w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <Navigation size={16} />
              المحافظة
            </label>
            <select
              disabled
              className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-navy-800 border-gray-200 dark:border-navy-800 border text-gray-500 dark:text-gray-400 outline-none cursor-not-allowed appearance-none"
              value={formData.governorate}
            >
              <option value="الديوانية">الديوانية</option>
            </select>
            <p className="text-xs text-gray-400 mt-1">الخدمة متاحة حالياً في الديوانية فقط</p>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <MapPin size={16} />
              المستشفى
            </label>
            <div className="relative">
              <select
                required
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-navy-950 border-gray-200 dark:border-navy-800 border focus:bg-white dark:focus:bg-navy-900 focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:text-white outline-none transition-all appearance-none"
                value={formData.hospitalName}
                onChange={(e) =>
                  setFormData({ ...formData, hospitalName: e.target.value })
                }
              >
                <option value="">اختر المستشفى</option>
                {DIWANIYAH_HOSPITALS.map((hospital) => (
                  <option key={hospital} value={hospital}>{hospital}</option>
                ))}
              </select>
              <Building2 className="absolute left-3 top-3.5 text-gray-400 pointer-events-none w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <Phone size={16} />
              رقم التواصل
            </label>
            <div className="relative">
                <input
                required
                type="tel"
                maxLength={11}
                className={`w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-navy-950 border ${phoneError ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-navy-800 focus:ring-red-500'} focus:bg-white dark:focus:bg-navy-900 focus:ring-2 dark:text-white outline-none transition-all text-left`}
                dir="ltr"
                placeholder="07xxxxxxxxx"
                value={formData.contactNumber}
                onChange={handlePhoneChange}
                />
            </div>
            {phoneError && <p className="text-red-500 text-xs font-medium">{phoneError}</p>}
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <FileText size={16} />
            شرح الحالة
          </label>
          <textarea
            required
            rows={4}
            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-navy-950 border-gray-200 dark:border-navy-800 border focus:bg-white dark:focus:bg-navy-900 focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:text-white outline-none transition-all resize-none"
            placeholder="مثال: المريض يحتاج لعملية قلب مفتوح غداً صباحاً، أو حادث سير..."
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
          />
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl flex gap-3 text-blue-700 dark:text-blue-300 text-sm border border-blue-100 dark:border-blue-900/30">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>
            تنبيه: سيتم تحليل النص تلقائياً لتحديد أولوية الحالة.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || !!phoneError}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" />
              جاري المعالجة...
            </>
          ) : (
            "إرسال طلب التبرع"
          )}
        </button>
      </form>
    </div>
  );
};