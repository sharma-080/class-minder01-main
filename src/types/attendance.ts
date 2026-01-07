export type SubjectColor = 
  | 'blue' 
  | 'green' 
  | 'purple' 
  | 'orange' 
  | 'pink' 
  | 'teal' 
  | 'red' 
  | 'yellow';

export interface Subject {
  id: string;
  name: string;
  color: SubjectColor;
  createdAt: string;
}

export interface TimeSlot {
  id: string;
  subjectId: string;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
}

export interface Timetable {
  id: string;
  name: string;
  slots: TimeSlot[];
  createdAt: string;
  isActive: boolean;
}

export interface ScheduledClass {
  id: string;
  subjectId: string;
  timetableId: string;
  date: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'rescheduled' | 'holiday';
  attended: boolean | null; // null = not marked yet
  reminderSent: boolean;
  attendanceReminderSent: boolean;
}

export interface AttendanceStats {
  totalClasses: number;
  attendedClasses: number;
  missedClasses: number;
  percentage: number;
}

export interface NotificationSettings {
  enabled: boolean;
  beforeClassMinutes: number;
  afterClassMinutes: number;
}

export const SUBJECT_COLORS: Record<SubjectColor, { bg: string; text: string; border: string }> = {
  blue: { bg: 'bg-blue-500', text: 'text-blue-500', border: 'border-blue-500' },
  green: { bg: 'bg-green-500', text: 'text-green-500', border: 'border-green-500' },
  purple: { bg: 'bg-purple-500', text: 'text-purple-500', border: 'border-purple-500' },
  orange: { bg: 'bg-orange-500', text: 'text-orange-500', border: 'border-orange-500' },
  pink: { bg: 'bg-pink-500', text: 'text-pink-500', border: 'border-pink-500' },
  teal: { bg: 'bg-teal-500', text: 'text-teal-500', border: 'border-teal-500' },
  red: { bg: 'bg-red-500', text: 'text-red-500', border: 'border-red-500' },
  yellow: { bg: 'bg-yellow-500', text: 'text-yellow-500', border: 'border-yellow-500' },
};

export const SUBJECT_COLOR_VALUES: SubjectColor[] = [
  'blue', 'green', 'purple', 'orange', 'pink', 'teal', 'red', 'yellow'
];
