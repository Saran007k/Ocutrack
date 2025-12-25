
export enum MedType {
  DROPS = 'DROPS',
  TABLET = 'TABLET'
}

export enum MedStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  UPCOMING = 'UPCOMING'
}

export interface Medication {
  id: string;
  name: string;
  type: MedType;
  dosage: string;
  frequency: number; // times per day
  times: string[]; // e.g., ["08:00", "20:00"]
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  notes?: string;
  eye?: 'Left' | 'Right' | 'Both';
}

export interface DailyTask {
  medicationId: string;
  medName: string;
  type: MedType;
  time: string;
  completed: boolean;
  eye?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
