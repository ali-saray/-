export enum BloodType {
  A_POS = "A+",
  A_NEG = "A-",
  B_POS = "B+",
  B_NEG = "B-",
  O_POS = "O+",
  O_NEG = "O-",
  AB_POS = "AB+",
  AB_NEG = "AB-",
}

export enum UrgencyLevel {
  LOW = "Low",
  MEDIUM = "Medium",
  HIGH = "High",
  CRITICAL = "Critical",
}

export enum RequestStatus {
  PENDING = "Pending",
  SENT_TO_TELEGRAM = "Sent",
  FULFILLED = "Fulfilled",
  CANCELLED = "Cancelled",
}

export enum RequestSource {
  INDIVIDUAL = "Individual",
  HOSPITAL = "Hospital",
}

export interface BloodRequestDetail {
  bloodType: BloodType;
  quantity: number;
}

export interface BloodRequest {
  id: string;
  patientName: string; // For hospitals, this can be "Stock Shortage" or department name
  hospitalName: string;
  governorate: string; // New field
  
  // Single blood type (backward compatibility & individuals)
  bloodType: BloodType; 
  quantity?: number;

  // Multiple blood types (mainly for hospitals)
  requestDetails?: BloodRequestDetail[]; 

  contactNumber: string;
  description: string;
  source: RequestSource;
  aiAnalysis?: {
    urgency: UrgencyLevel;
    summary: string;
    suggestedMessage: string;
  };
  status: RequestStatus;
  createdAt: number;
}

export interface AppConfig {
  botToken: string;
  chatId: string;
  whatsappNumber: string; // Optional: specific number to send notifications to
}