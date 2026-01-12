import { BloodRequest, RequestSource } from "../types";

// Helper to clean user input from markdown characters that might break the message
const clean = (text: any): string => {
    if (!text) return "";
    // Replace *, _, `, [, ] with space to prevent markdown parsing errors
    return String(text).replace(/[*_`\[\]]/g, ' ').trim();
};

export const constructMessage = (request: BloodRequest): string => {
    const loc = request.governorate ? `المحافظة: ${clean(request.governorate)}` : "الديوانية";
    let messageContent = "";

    const hospitalName = clean(request.hospitalName);
    const patientName = clean(request.patientName);
    const description = clean(request.description);
    const contactNumber = clean(request.contactNumber);

    if (request.source === RequestSource.HOSPITAL) {
        let details = "";
        if (request.requestDetails && request.requestDetails.length > 0) {
            details = request.requestDetails.map(d => `▫️ ${d.bloodType}: (${d.quantity}) كيس`).join("\n");
        } else {
            details = `▫️ الفصيلة: ${request.bloodType}\n▫️ العدد المطلوب: ${request.quantity || 1}`;
        }
        
        messageContent = `🏥 *نداء استغاثة رسمي (نقص مخزون)*\n\n` +
                         `🏢 المستشفى: ${hospitalName}\n` +
                         `📍 الموقع: ${loc}\n` +
                         `📂 القسم: ${patientName}\n\n` +
                         `⚠️ *النواقص المطلوبة:*\n${details}\n\n` +
                         `${description ? `📝 ملاحظات: ${description}\n\n` : ""}`;
    } else {
        messageContent = `🔴 *نداء إنساني عاجل (طلب دم)*\n\n` +
                         `👤 المريض: ${patientName}\n` +
                         `🩸 الفصيلة: ${request.bloodType}\n` +
                         `🏥 المستشفى: ${hospitalName}\n` +
                         `📍 الموقع: ${loc}\n\n` +
                         `${description ? `📝 وصف الحالة: ${description}\n\n` : ""}`;
    }

    return `${messageContent.trim()}\n\n📞 *للتواصل المباشر:* ${contactNumber}\n\n#نبض #تبرع_بالدم`;
};