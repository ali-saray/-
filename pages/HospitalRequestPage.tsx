import React, { useState } from "react";
import { BloodType, BloodRequest, RequestStatus, RequestSource, BloodRequestDetail } from "../types";
import { saveRequest, getAppConfig } from "../services/storageService";
import { analyzeRequest } from "../services/geminiService";
import { constructMessage } from "../services/messageUtils";
import { sendToTelegram } from "../services/telegramService";
import { Loader2, Send, Building2, Phone, Clipboard, Layers, Plus, Trash2, Navigation } from "lucide-react";
import { v4 as uuidv4 } from 'uuid';

const DIWANIYAH_HOSPITALS = [
  "مستشفى الديوانية التعليمي",
  "مستشفى النسائية والأطفال التعليمي",
  "مستشفى الشامية العام",
  "مستشفى عفك العام",
  "مستشفى الحمزة العام",
  "مستشفى الرميثة العام"
];

export const HospitalRequestPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [sentToTelegram, setSentToTelegram] = useState(false);
  
  // Form State
  const [hospitalName, setHospitalName] = useState("");
  const [governorate, setGovernorate] = useState("الديوانية"); // Fixed
  const [department, setDepartment] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [description, setDescription] = useState("");
  
  // Multi-type state
  const [requestDetails, setRequestDetails] = useState<BloodRequestDetail[]>([
    { bloodType: BloodType.O_POS, quantity: 5 }
  ]);

  const addDetailRow = () => {
    setRequestDetails([...requestDetails, { bloodType: BloodType.O_POS, quantity: 5 }]);
  };

  const removeDetailRow = (index: number) => {
    if (requestDetails.length > 1) {
      const newDetails = [...requestDetails];
      newDetails.splice(index, 1);
      setRequestDetails(newDetails);
    }
  };

  const updateDetail = (index: number, field: keyof BloodRequestDetail, value: any) => {
    const newDetails = [...requestDetails];
    newDetails[index] = { ...newDetails[index], [field]: value };
    setRequestDetails(newDetails);
  };

  const validatePhone = (phone: string) => {
    // Regex for Iraqi mobile numbers: Starts with 07 followed by 9 digits (11 total)
    const iraqiPhoneRegex = /^07\d{9}$/;
    return iraqiPhoneRegex.test(phone);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Allow only numbers
    if (val === "" || /^\d+$/.test(val)) {
        setContactNumber(val);
        if (val.length > 0 && !/^07\d{9}$/.test(val)) {
             if(val.length === 11) {
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
    if (!validatePhone(contactNumber)) {
        setPhoneError("يرجى إدخال رقم عراقي صحيح (07xxxxxxxxx)");
        return;
    }
    if (!hospitalName) {
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
      const source = RequestSource.HOSPITAL;

      // 1. Analyze with AI (pass all details)
      const totalQuantity = requestDetails.reduce((acc, curr) => acc + curr.quantity, 0);
      const aiAnalysis = await analyzeRequest(
        description || `نقص حاد في المخزون لقسم ${department}`,
        requestDetails[0].bloodType, // Fallback primary type
        hospitalName,
        governorate,
        source,
        totalQuantity,
        requestDetails
      );

      // 2. Create Object
      const newRequest: BloodRequest = {
        id: uuidv4(),
        patientName: department || "المخزن الرئيسي",
        hospitalName,
        governorate,
        contactNumber,
        description,
        source,
        aiAnalysis,
        status: RequestStatus.PENDING,
        createdAt: Date.now(),
        // Save the multi-type details
        bloodType: requestDetails[0].bloodType, // Primary for sorting/display fallback
        quantity: totalQuantity,
        requestDetails: requestDetails
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
      
      // Reset form
      setHospitalName("");
      setDepartment("");
      setContactNumber("");
      setDescription("");
      setRequestDetails([{ bloodType: BloodType.O_POS, quantity: 5 }]);

    } catch (error) {
      console.error(error);
      if (waWindow) waWindow.close();
      alert("حدث خطأ أثناء إرسال الطلب");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center p-6 animate-in fade-in zoom-in duration-300">
        <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-900/30 rounded-full flex items-center justify-center mb-6">
            <Building2 className="text-zinc-900 dark:text-zinc-400 w-10 h-10" />
        </div>
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">تم تسجيل طلب المستشفى</h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8 space-y-2">
          <span className="block">سيتم وضع علامة "طلب رسمي" على هذا النداء ونشره بأولوية عالية للمتبرعين.</span>
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
          className="text-zinc-900 dark:text-zinc-400 font-medium hover:text-black dark:hover:text-zinc-300 underline"
        >
          تسجيل نقص آخر
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900/50 text-zinc-900 dark:text-zinc-300 px-3 py-1 rounded-full text-sm font-medium mb-3 border border-zinc-200 dark:border-zinc-800">
            <Building2 size={16} />
            <span>خاص بالمؤسسات الصحية</span>
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">طلب دعم رصيد (مستشفيات)</h1>
        <p className="text-gray-500 dark:text-gray-400">
          يمكنك إضافة فصائل متعددة في طلب واحد في حال النقص الشامل.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-navy-900 rounded-2xl shadow-xl dark:shadow-none dark:border dark:border-navy-800 p-8 space-y-6 border-t-4 border-t-zinc-900">
        
        {/* Hospital Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <Navigation size={16} />
              المحافظة
            </label>
            <select
              disabled
              className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-navy-800 border-gray-200 dark:border-navy-800 border text-gray-500 dark:text-gray-400 outline-none cursor-not-allowed appearance-none"
              value={governorate}
            >
              <option value="الديوانية">الديوانية</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <Building2 size={16} />
              اسم المستشفى
            </label>
            <div className="relative">
              <select
                required
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-navy-950 border-gray-200 dark:border-navy-800 border focus:bg-white dark:focus:bg-navy-900 focus:ring-2 focus:ring-zinc-600 focus:border-zinc-900 dark:text-white outline-none transition-all appearance-none"
                value={hospitalName}
                onChange={(e) => setHospitalName(e.target.value)}
              >
                <option value="">اختر المؤسسة الصحية</option>
                {DIWANIYAH_HOSPITALS.map((hospital) => (
                  <option key={hospital} value={hospital}>{hospital}</option>
                ))}
              </select>
              <Building2 className="absolute left-3 top-3.5 text-gray-400 pointer-events-none w-5 h-5" />
            </div>
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <Layers size={16} />
              القسم الطالب
            </label>
            <input
              required
              type="text"
              className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-navy-950 border-gray-200 dark:border-navy-800 border focus:bg-white dark:focus:bg-navy-900 focus:ring-2 focus:ring-zinc-600 focus:border-zinc-900 dark:text-white outline-none transition-all"
              placeholder="الطوارئ، العمليات، بنك الدم..."
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            />
          </div>
        </div>

        {/* Dynamic Blood Types */}
        <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <Clipboard size={16} />
              قائمة الفصائل المطلوبة
            </label>
            
            <div className="space-y-3">
                {requestDetails.map((detail, index) => (
                    <div key={index} className="flex gap-3 items-center bg-gray-50 dark:bg-navy-950 p-3 rounded-xl border border-gray-100 dark:border-navy-800">
                        <div className="flex-1">
                            <select
                                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-navy-900 border-gray-200 dark:border-navy-800 border focus:ring-2 focus:ring-zinc-600 dark:text-white outline-none text-sm"
                                value={detail.bloodType}
                                onChange={(e) => updateDetail(index, 'bloodType', e.target.value)}
                            >
                                {Object.values(BloodType).map((type) => (
                                <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>
                        <div className="w-24">
                            <input
                                type="number"
                                min="1"
                                placeholder="العدد"
                                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-navy-900 border-gray-200 dark:border-navy-800 border focus:ring-2 focus:ring-zinc-600 dark:text-white outline-none text-sm text-center"
                                value={detail.quantity}
                                onChange={(e) => updateDetail(index, 'quantity', parseInt(e.target.value) || 0)}
                            />
                        </div>
                        {requestDetails.length > 1 && (
                            <button 
                                type="button"
                                onClick={() => removeDetailRow(index)}
                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                            >
                                <Trash2 size={18} />
                            </button>
                        )}
                    </div>
                ))}
            </div>

            <button
                type="button"
                onClick={addDetailRow}
                className="text-sm text-zinc-900 dark:text-zinc-300 font-medium flex items-center gap-1 hover:underline px-1"
            >
                <Plus size={16} />
                إضافة فصيلة أخرى
            </button>
        </div>

        <div className="space-y-2">
           <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <Phone size={16} />
              رقم تواصل (منسق)
            </label>
            <input
              required
              type="tel"
              maxLength={11}
              className={`w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-navy-950 border ${phoneError ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-navy-800 focus:ring-zinc-600'} focus:bg-white dark:focus:bg-navy-900 focus:ring-2 dark:text-white outline-none transition-all text-left`}
              dir="ltr"
              placeholder="07xxxxxxxxx"
              value={contactNumber}
              onChange={handlePhoneChange}
            />
            {phoneError && <p className="text-red-500 text-xs font-medium">{phoneError}</p>}
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
             ملاحظات إضافية (اختياري)
          </label>
          <textarea
            rows={2}
            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-navy-950 border-gray-200 dark:border-navy-800 border focus:bg-white dark:focus:bg-navy-900 focus:ring-2 focus:ring-zinc-600 focus:border-zinc-900 dark:text-white outline-none transition-all resize-none"
            placeholder="مثال: نحتاج متبرعين بصفائح دموية أيضاً..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !!phoneError}
          className="w-full bg-zinc-900 hover:bg-black text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-zinc-900/30 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" />
              جاري إرسال النداء...
            </>
          ) : (
            "نشر طلب استغاثة"
          )}
        </button>
      </form>
    </div>
  );
};