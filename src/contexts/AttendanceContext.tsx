import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  Subject,
  Timetable,
  TimeSlot,
  ScheduledClass,
  NotificationSettings,
  AttendanceStats,
} from '@/types/attendance';
import { addDays, format, startOfDay, getDay } from 'date-fns';
import { db } from '@/lib/firebase';
import { doc, collection, getDocs, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useFirebase } from './FirebaseContext'; 

interface AttendanceContextType {
  subjects: Subject[];
  timetables: Timetable[];
  activeTimetable: Timetable | null;
  scheduledClasses: ScheduledClass[];
  notificationSettings: NotificationSettings;
  theme: 'light' | 'dark';
  userName: string;

  // SUBJECTS
  addSubject: (name: string, color: Subject['color']) => Promise<void>;
  updateSubject: (id: string, name: string, color: Subject['color']) => Promise<void>;
  deleteSubject: (id: string) => Promise<void>;

  // TIMETABLES
  addTimetable: (name: string) => Promise<void>;
  setActiveTimetable: (id: string) => Promise<void>;
  deleteTimetable: (id: string) => Promise<void>;

  // TIME SLOTS
  addTimeSlot: (timetableId: string, slot: Omit<TimeSlot, 'id'>) => Promise<void>;
  removeTimeSlot: (timetableId: string, slotId: string) => Promise<void>;

  // CLASSES
  generateSchedule: (months: number) => Promise<void>;
  updateClassStatus: (classId: string, status: ScheduledClass['status']) => Promise<void>;
  markAttendance: (classId: string, attended: boolean) => Promise<void>;
  resetAttendance: (classId: string) => Promise<void>;
  resetClassStatus: (classId: string) => Promise<void>;
  markTodayAsHoliday: () => Promise<void>;

  // STATS
  getAttendanceStats: (subjectId?: string) => AttendanceStats;
  getTodayClasses: () => ScheduledClass[];
  getUpcomingClass: () => ScheduledClass | null;

  // SETTINGS
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => Promise<void>;
  toggleTheme: () => void;
  getSubjectById: (id: string) => Subject | undefined;
  setUserName: (name: string) => Promise<void>;
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

export function AttendanceProvider({ children }: { children: ReactNode }) {
  const { user } = useFirebase();
  const userId = user?.uid;

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [scheduledClasses, setScheduledClasses] = useState<ScheduledClass[]>([]);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    enabled: false,
    beforeClassMinutes: 15,
    afterClassMinutes: 10,
  });
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [userName, setUserNameState] = useState<string>('Student');

  const activeTimetable = timetables.find(t => t.isActive) || null;
  const generateId = () => Math.random().toString(36).substring(2, 15);

  /** ---------------------- DARK/LIGHT MODE ---------------------- */
  // Load saved theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) setTheme(savedTheme);
  }, []);

  // Apply theme to <html> and persist
  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));

  /** ---------------------- LOAD DATA ---------------------- */
  useEffect(() => {
    if (!userId) return;

    const loadData = async () => {
      try {
        const subjectsSnap = await getDocs(collection(db, `users/${userId}/subjects`));
        setSubjects(subjectsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subject)));

        const timetablesSnap = await getDocs(collection(db, `users/${userId}/timetables`));
        setTimetables(timetablesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Timetable)));

        const classesSnap = await getDocs(collection(db, `users/${userId}/classes`));
        setScheduledClasses(classesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ScheduledClass)));

        const notifSnap = await getDoc(doc(db, `users/${userId}`, 'notificationSettings'));
        if (notifSnap.exists()) setNotificationSettings(notifSnap.data() as NotificationSettings);

        const userSnap = await getDoc(doc(db, `users/${userId}`, 'profile'));
        if (userSnap.exists()) setUserNameState(userSnap.data()?.userName || 'Student');
      } catch (err) {
        console.error('Error loading attendance data:', err);
      }
    };

    loadData();
  }, [userId]);

  /** ---------------------- SUBJECTS ---------------------- */
  const addSubject = async (name: string, color: Subject['color']) => {
    if (!userId) return;
    const id = generateId();
    const newSubject: Subject = { id, name, color, createdAt: new Date().toISOString() };
    await setDoc(doc(db, `users/${userId}/subjects`, id), newSubject);
    setSubjects(prev => [...prev, newSubject]);
  };

  const updateSubject = async (id: string, name: string, color: Subject['color']) => {
    if (!userId) return;
    await updateDoc(doc(db, `users/${userId}/subjects`, id), { name, color });
    setSubjects(prev => prev.map(s => (s.id === id ? { ...s, name, color } : s)));
  };

  const deleteSubject = async (id: string) => {
    if (!userId) return;
    await deleteDoc(doc(db, `users/${userId}/subjects`, id));
    setSubjects(prev => prev.filter(s => s.id !== id));
    setTimetables(prev =>
      prev.map(t => ({ ...t, slots: t.slots.filter(slot => slot.subjectId !== id) }))
    );
    const classesToDelete = scheduledClasses.filter(c => c.subjectId === id);
    for (const cls of classesToDelete) {
      await deleteDoc(doc(db, `users/${userId}/classes`, cls.id));
    }
    setScheduledClasses(prev => prev.filter(c => c.subjectId !== id));
  };

  /** ---------------------- TIMETABLES ---------------------- */
  const addTimetable = async (name: string) => {
    if (!userId) return;
    const id = generateId();
    const newTimetable: Timetable = { id, name, slots: [], createdAt: new Date().toISOString(), isActive: timetables.length === 0 };
    await setDoc(doc(db, `users/${userId}/timetables`, id), newTimetable);
    setTimetables(prev => [...prev, newTimetable]);
  };

  const setActiveTimetable = async (id: string) => {
    if (!userId) return;
    const updated = timetables.map(t => ({ ...t, isActive: t.id === id }));
    for (const t of updated) {
      await setDoc(doc(db, `users/${userId}/timetables`, t.id), t);
    }
    setTimetables(updated);
  };

  const deleteTimetable = async (id: string) => {
    if (!userId) return;
    await deleteDoc(doc(db, `users/${userId}/timetables`, id));
    const filtered = timetables.filter(t => t.id !== id);
    if (filtered.length > 0 && !filtered.some(t => t.isActive)) filtered[0].isActive = true;
    setTimetables(filtered);

    const classesToDelete = scheduledClasses.filter(c => c.timetableId === id);
    for (const cls of classesToDelete) {
      await deleteDoc(doc(db, `users/${userId}/classes`, cls.id));
    }
    setScheduledClasses(prev => prev.filter(c => c.timetableId !== id));
  };

  /** ---------------------- TIME SLOTS ---------------------- */
  const addTimeSlot = async (timetableId: string, slot: Omit<TimeSlot, 'id'>) => {
    if (!userId) return;
    const timetable = timetables.find(t => t.id === timetableId);
    if (!timetable) return;
    const newSlot: TimeSlot = { ...slot, id: generateId() };
    const updated = { ...timetable, slots: [...timetable.slots, newSlot] };
    await setDoc(doc(db, `users/${userId}/timetables`, timetableId), updated);
    setTimetables(prev => prev.map(t => (t.id === timetableId ? updated : t)));
  };

  const removeTimeSlot = async (timetableId: string, slotId: string) => {
    if (!userId) return;
    const timetable = timetables.find(t => t.id === timetableId);
    if (!timetable) return;
    const updated = { ...timetable, slots: timetable.slots.filter(s => s.id !== slotId) };
    await setDoc(doc(db, `users/${userId}/timetables`, timetableId), updated);
    setTimetables(prev => prev.map(t => (t.id === timetableId ? updated : t)));
  };

  /** ---------------------- SCHEDULED CLASSES ---------------------- */
  const generateSchedule = async (months: number) => {
    if (!userId || !activeTimetable) return;
    const startDate = startOfDay(new Date());
    const endDate = addDays(startDate, months * 30);
    const newClasses: ScheduledClass[] = [];

    let currentDate = startDate;
    while (currentDate <= endDate) {
      const dayOfWeek = getDay(currentDate);
      const daySlots = activeTimetable.slots.filter(slot => slot.dayOfWeek === dayOfWeek);
      for (const slot of daySlots) {
        const cls: ScheduledClass = {
          id: generateId(),
          subjectId: slot.subjectId,
          timetableId: activeTimetable.id,
          date: format(currentDate, 'yyyy-MM-dd'),
          startTime: slot.startTime,
          endTime: slot.endTime,
          status: 'scheduled',
          attended: null,
          reminderSent: false,
          attendanceReminderSent: false,
        };
        await setDoc(doc(db, `users/${userId}/classes`, cls.id), cls);
        newClasses.push(cls);
      }
      currentDate = addDays(currentDate, 1);
    }
    setScheduledClasses(prev => [...prev.filter(c => c.timetableId !== activeTimetable.id), ...newClasses]);
  };

  const updateClassStatus = async (classId: string, status: ScheduledClass['status']) => {
    if (!userId) return;
    await updateDoc(doc(db, `users/${userId}/classes`, classId), { status });
    setScheduledClasses(prev => prev.map(c => (c.id === classId ? { ...c, status } : c)));
  };

  const markAttendance = async (classId: string, attended: boolean) => {
    if (!userId) return;
    await updateDoc(doc(db, `users/${userId}/classes`, classId), { attended });
    setScheduledClasses(prev => prev.map(c => (c.id === classId ? { ...c, attended } : c)));
  };

  const resetAttendance = async (classId: string) => {
    if (!userId) return;
    await updateDoc(doc(db, `users/${userId}/classes`, classId), { attended: null });
    setScheduledClasses(prev => prev.map(c => (c.id === classId ? { ...c, attended: null } : c)));
  };

  const resetClassStatus = async (classId: string) => {
    if (!userId) return;
    await updateDoc(doc(db, `users/${userId}/classes`, classId), { status: 'scheduled', attended: null });
    setScheduledClasses(prev => prev.map(c => (c.id === classId ? { ...c, status: 'scheduled', attended: null } : c)));
  };

  const markTodayAsHoliday = async () => {
    if (!userId) return;
    const today = format(new Date(), 'yyyy-MM-dd');
    for (const cls of scheduledClasses.filter(c => c.date === today && c.status === 'scheduled')) {
      await updateDoc(doc(db, `users/${userId}/classes`, cls.id), { status: 'holiday' });
    }
    setScheduledClasses(prev => prev.map(c => (c.date === today && c.status === 'scheduled' ? { ...c, status: 'holiday' } : c)));
  };

  /** ---------------------- NOTIFICATIONS ---------------------- */
  const updateNotificationSettings = async (settings: Partial<NotificationSettings>) => {
    if (!userId) return;
    const notifRef = doc(db, `users/${userId}`, 'notificationSettings');
    const updated = { ...notificationSettings, ...settings };
    await setDoc(notifRef, updated);
    setNotificationSettings(updated);
  };

  /** ---------------------- USERNAME ---------------------- */
  const setUserName = async (name: string) => {
    if (!userId) return;
    setUserNameState(name);
    const profileRef = doc(db, `users/${userId}`, 'profile');
    await setDoc(profileRef, { userName: name }, { merge: true });
  };

  /** ---------------------- HELPERS ---------------------- */
  const getAttendanceStats = (subjectId?: string): AttendanceStats => {
    let relevant = scheduledClasses.filter(c => c.attended !== null);
    if (subjectId) relevant = relevant.filter(c => c.subjectId === subjectId);
    const totalClasses = relevant.length;
    const attendedClasses = relevant.filter(c => c.attended).length;
    const missedClasses = relevant.filter(c => c.attended === false).length;
    const percentage = totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : 0;
    return { totalClasses, attendedClasses, missedClasses, percentage };
  };

  const getTodayClasses = () =>
    scheduledClasses.filter(c => c.date === format(new Date(), 'yyyy-MM-dd')).sort((a, b) => a.startTime.localeCompare(b.startTime));

  const getUpcomingClass = (): ScheduledClass | null => {
    const now = new Date();
    const today = format(now, 'yyyy-MM-dd');
    const currentTime = format(now, 'HH:mm');
    const todayClasses = scheduledClasses
      .filter(c => c.date === today && c.startTime > currentTime && c.status !== 'cancelled')
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
    return todayClasses[0] || null;
  };

  const getSubjectById = (id: string) => subjects.find(s => s.id === id);

  return (
    <AttendanceContext.Provider
      value={{
        subjects,
        timetables,
        activeTimetable,
        scheduledClasses,
        notificationSettings,
        theme,
        userName,
        addSubject,
        updateSubject,
        deleteSubject,
        addTimetable,
        setActiveTimetable,
        deleteTimetable,
        addTimeSlot,
        removeTimeSlot,
        generateSchedule,
        updateClassStatus,
        markAttendance,
        resetAttendance,
        resetClassStatus,
        markTodayAsHoliday,
        getAttendanceStats,
        getTodayClasses,
        getUpcomingClass,
        updateNotificationSettings,
        toggleTheme,
        getSubjectById,
        setUserName,
      }}
    >
      {children}
    </AttendanceContext.Provider>
  );
}

export function useAttendance() {
  const context = useContext(AttendanceContext);
  if (!context) throw new Error('useAttendance must be used within AttendanceProvider');
  return context;
}
