import { TimetableGrid } from '@/components/TimetableGrid';

export default function Timetable() {
  return (
    <div className="container max-w-screen-xl py-6 px-4">
      <h1 className="text-2xl font-bold mb-6">Timetable</h1>
      <TimetableGrid />
    </div>
  );
}
