import { useEffect, useCallback } from 'react';
import { useAttendance } from '@/contexts/AttendanceContext';
import { format, parse, addMinutes, subMinutes, isAfter, isBefore } from 'date-fns';

export function useNotifications() {
  const {
    scheduledClasses,
    notificationSettings,
    getSubjectById,
    updateClassStatus,
    markAttendance,
  } = useAttendance();

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }, []);

  const sendNotification = useCallback((title: string, body: string, tag: string) => {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        body,
        tag,
        icon: '/favicon.ico',
        requireInteraction: true,
      });
    }
  }, []);

  const checkAndSendReminders = useCallback(() => {
    if (!notificationSettings.enabled) return;

    const now = new Date();
    const today = format(now, 'yyyy-MM-dd');

    scheduledClasses.forEach((classItem) => {
      if (classItem.date !== today) return;
      if (classItem.status === 'cancelled') return;

      const subject = getSubjectById(classItem.subjectId);
      if (!subject) return;

      const classStartTime = parse(
        `${classItem.date} ${classItem.startTime}`,
        'yyyy-MM-dd HH:mm',
        new Date()
      );
      const classEndTime = parse(
        `${classItem.date} ${classItem.endTime}`,
        'yyyy-MM-dd HH:mm',
        new Date()
      );

      // 15 minutes before class reminder
      const reminderTime = subMinutes(classStartTime, notificationSettings.beforeClassMinutes);
      if (
        !classItem.reminderSent &&
        isAfter(now, reminderTime) &&
        isBefore(now, classStartTime)
      ) {
        sendNotification(
          `${subject.name} class in ${notificationSettings.beforeClassMinutes} minutes`,
          'Is your class happening today?',
          `reminder-${classItem.id}`
        );
      }

      // 10 minutes after class attendance reminder
      const attendanceReminderTime = addMinutes(
        classEndTime,
        notificationSettings.afterClassMinutes
      );
      if (
        !classItem.attendanceReminderSent &&
        classItem.attended === null &&
        classItem.status === 'confirmed' &&
        isAfter(now, attendanceReminderTime)
      ) {
        sendNotification(
          `Did you attend ${subject.name}?`,
          'Mark your attendance now',
          `attendance-${classItem.id}`
        );
      }
    });
  }, [scheduledClasses, notificationSettings, getSubjectById, sendNotification]);

  useEffect(() => {
    if (!notificationSettings.enabled) return;

    // Check every minute
    const interval = setInterval(checkAndSendReminders, 60000);
    checkAndSendReminders(); // Check immediately

    return () => clearInterval(interval);
  }, [notificationSettings.enabled, checkAndSendReminders]);

  return {
    requestPermission,
    sendNotification,
    isSupported: 'Notification' in window,
    permission: typeof window !== 'undefined' && 'Notification' in window 
      ? Notification.permission 
      : 'denied',
  };
}
