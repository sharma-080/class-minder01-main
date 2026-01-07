import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { useAttendance } from '@/contexts/AttendanceContext';
import { SUBJECT_COLORS } from '@/types/attendance';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function CalendarView() {
  const { scheduledClasses, getSubjectById, updateClassStatus, markAttendance } = useAttendance();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Pad the beginning with empty days
  const startPadding = monthStart.getDay();
  const paddedDays = [...Array(startPadding).fill(null), ...daysInMonth];

  const getClassesForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return scheduledClasses.filter((c) => c.date === dateStr);
  };

  const selectedDateClasses = selectedDate ? getClassesForDate(selectedDate) : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentMonth(new Date())}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="rounded-lg border overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 bg-muted">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="p-2 text-center text-sm font-medium">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {paddedDays.map((day, index) => {
            if (!day) {
              return <div key={`empty-${index}`} className="min-h-[80px] border-t border-r" />;
            }

            const classes = getClassesForDate(day);
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={day.toISOString()}
                className={`min-h-[80px] border-t border-r p-1 cursor-pointer hover:bg-muted/50 ${
                  isToday ? 'bg-accent' : ''
                }`}
                onClick={() => setSelectedDate(day)}
              >
                <div className={`text-sm ${isToday ? 'font-bold' : ''}`}>
                  {format(day, 'd')}
                </div>
                <div className="space-y-0.5 mt-1">
                  {classes.slice(0, 3).map((classItem) => {
                    const subject = getSubjectById(classItem.subjectId);
                    if (!subject) return null;

                    return (
                      <div
                        key={classItem.id}
                        className={`text-[10px] px-1 rounded truncate text-white ${
                          SUBJECT_COLORS[subject.color].bg
                        } ${classItem.status === 'cancelled' ? 'opacity-50 line-through' : ''}`}
                      >
                        {subject.name}
                      </div>
                    );
                  })}
                  {classes.length > 3 && (
                    <div className="text-[10px] text-muted-foreground">
                      +{classes.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Day Detail Dialog */}
      <Dialog open={!!selectedDate} onOpenChange={() => setSelectedDate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[400px] overflow-auto">
            {selectedDateClasses.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                No classes scheduled for this day.
              </p>
            ) : (
              selectedDateClasses.map((classItem) => {
                const subject = getSubjectById(classItem.subjectId);
                if (!subject) return null;

                return (
                  <div
                    key={classItem.id}
                    className={`p-3 rounded-lg border-l-4 ${SUBJECT_COLORS[subject.color].border} bg-muted/50`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">{subject.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {classItem.startTime} - {classItem.endTime}
                        </p>
                      </div>
                      <div className="text-xs">
                        {classItem.status === 'cancelled' && (
                          <span className="text-destructive">Cancelled</span>
                        )}
                        {classItem.status === 'rescheduled' && (
                          <span className="text-warning">Rescheduled</span>
                        )}
                        {classItem.attended === true && (
                          <span className="text-green-500">✓ Attended</span>
                        )}
                        {classItem.attended === false && (
                          <span className="text-destructive">✗ Missed</span>
                        )}
                      </div>
                    </div>

                    {classItem.status === 'scheduled' && (
                      <div className="mt-2 flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateClassStatus(classItem.id, 'confirmed')}
                        >
                          Confirm
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateClassStatus(classItem.id, 'cancelled')}
                        >
                          Cancel
                        </Button>
                      </div>
                    )}

                    {classItem.status === 'confirmed' && classItem.attended === null && (
                      <div className="mt-2 flex gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => markAttendance(classItem.id, true)}
                        >
                          ✓ Attended
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => markAttendance(classItem.id, false)}
                        >
                          ✗ Missed
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
