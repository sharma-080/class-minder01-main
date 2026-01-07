import { useState } from 'react';
import { useAttendance } from '@/contexts/AttendanceContext';
import { TimeSlot, SUBJECT_COLORS } from '@/types/attendance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, X, Calendar } from 'lucide-react';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7 AM to 8 PM

export function TimetableGrid() {
  const {
    subjects,
    activeTimetable,
    timetables,
    addTimetable,
    setActiveTimetable,
    addTimeSlot,
    removeTimeSlot,
    generateSchedule,
  } = useAttendance();

  const [isAddSlotOpen, setIsAddSlotOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [isNewTimetableOpen, setIsNewTimetableOpen] = useState(false);
  const [newTimetableName, setNewTimetableName] = useState('');
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [months, setMonths] = useState('1');

  const handleAddSlot = () => {
    if (!activeTimetable || !selectedSubject) return;

    addTimeSlot(activeTimetable.id, {
      subjectId: selectedSubject,
      dayOfWeek: selectedDay,
      startTime,
      endTime,
    });

    setIsAddSlotOpen(false);
    setSelectedSubject('');
    setStartTime('09:00');
    setEndTime('10:00');
  };

  const handleCreateTimetable = () => {
    if (!newTimetableName.trim()) return;
    addTimetable(newTimetableName.trim());
    setNewTimetableName('');
    setIsNewTimetableOpen(false);
  };

  const handleGenerate = () => {
    const monthNum = parseInt(months);
    if (monthNum > 0 && monthNum <= 12) {
      generateSchedule(monthNum);
      setIsGenerateOpen(false);
    }
  };

  const openAddSlot = (day: number, hour?: number) => {
    setSelectedDay(day);
    if (hour !== undefined) {
      const timeStr = `${hour.toString().padStart(2, '0')}:00`;
      setStartTime(timeStr);
      // Set end time to 1 hour after start
      const endHour = Math.min(hour + 1, 20);
      setEndTime(`${endHour.toString().padStart(2, '0')}:00`);
    }
    setIsAddSlotOpen(true);
  };

  const getSlotForCell = (day: number, hour: number): TimeSlot | undefined => {
    if (!activeTimetable) return undefined;
    return activeTimetable.slots.find((slot) => {
      const slotHour = parseInt(slot.startTime.split(':')[0]);
      return slot.dayOfWeek === day && slotHour === hour;
    });
  };

  const getSubject = (subjectId: string) => {
    return subjects.find((s) => s.id === subjectId);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Select
            value={activeTimetable?.id || ''}
            onValueChange={setActiveTimetable}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select timetable" />
            </SelectTrigger>
            <SelectContent>
              {timetables.map((tt) => (
                <SelectItem key={tt.id} value={tt.id}>
                  {tt.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => setIsNewTimetableOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            New
          </Button>
        </div>
        <Button onClick={() => setIsGenerateOpen(true)} disabled={!activeTimetable}>
          <Calendar className="h-4 w-4 mr-2" />
          Generate Schedule
        </Button>
      </div>

      {!activeTimetable ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No timetable selected.</p>
          <p className="text-sm">Create a new timetable to get started.</p>
        </div>
      ) : subjects.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No subjects added yet.</p>
          <p className="text-sm">Add subjects first to create your timetable.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Header */}
            <div className="grid grid-cols-8 gap-1 mb-2">
              <div className="p-2 text-center font-medium text-sm text-muted-foreground">Time</div>
              {DAYS.map((day, index) => (
                <div key={day} className="p-2 text-center font-medium text-sm">
                  <span className="hidden sm:inline">{day}</span>
                  <span className="sm:hidden">{day.slice(0, 3)}</span>
                </div>
              ))}
            </div>

            {/* Grid */}
            {HOURS.map((hour) => (
              <div key={hour} className="grid grid-cols-8 gap-1 mb-1">
                <div className="p-2 text-center text-sm text-muted-foreground">
                  {hour.toString().padStart(2, '0')}:00
                </div>
                {DAYS.map((_, dayIndex) => {
                  const slot = getSlotForCell(dayIndex, hour);
                  const subject = slot ? getSubject(slot.subjectId) : null;

                  return (
                    <div
                      key={dayIndex}
                      className={`min-h-[50px] rounded border p-1 ${
                        slot && subject
                          ? `${SUBJECT_COLORS[subject.color].bg} text-white`
                          : 'bg-muted/30 hover:bg-muted cursor-pointer'
                      }`}
                      onClick={() => !slot && openAddSlot(dayIndex, hour)}
                    >
                      {slot && subject ? (
                        <div className="flex items-start justify-between h-full">
                          <div className="text-xs font-medium truncate flex-1">
                            {subject.name}
                            <div className="text-[10px] opacity-80">
                              {slot.startTime} - {slot.endTime}
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeTimeSlot(activeTimetable.id, slot.id);
                            }}
                            className="opacity-70 hover:opacity-100"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="h-full flex items-center justify-center">
                          <Plus className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Slot Dialog */}
      <Dialog open={isAddSlotOpen} onOpenChange={setIsAddSlotOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Class</DialogTitle>
            <DialogDescription>
              Add a class for {DAYS[selectedDay]}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Subject</Label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${SUBJECT_COLORS[subject.color].bg}`} />
                        {subject.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddSlotOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSlot} disabled={!selectedSubject}>
              Add Class
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Timetable Dialog */}
      <Dialog open={isNewTimetableOpen} onOpenChange={setIsNewTimetableOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Timetable</DialogTitle>
            <DialogDescription>
              Create a new timetable for a different semester or term.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Timetable Name</Label>
              <Input
                value={newTimetableName}
                onChange={(e) => setNewTimetableName(e.target.value)}
                placeholder="e.g., Fall 2024"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewTimetableOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTimetable} disabled={!newTimetableName.trim()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate Schedule Dialog */}
      <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Schedule</DialogTitle>
            <DialogDescription>
              Generate classes for the next few months based on your timetable.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Number of Months</Label>
              <Input
                type="number"
                min="1"
                max="12"
                value={months}
                onChange={(e) => setMonths(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGenerateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleGenerate}>Generate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
