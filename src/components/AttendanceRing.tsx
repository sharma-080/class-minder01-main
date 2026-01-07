import { useAttendance } from '@/contexts/AttendanceContext';
import { AttendanceStats } from '@/types/attendance';

interface AttendanceRingProps {
  stats: AttendanceStats;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function AttendanceRing({ stats, size = 'md', showLabel = true }: AttendanceRingProps) {
  const { theme } = useAttendance();
  
  const sizes = {
    sm: { width: 60, strokeWidth: 4, fontSize: 'text-sm' },
    md: { width: 100, strokeWidth: 6, fontSize: 'text-xl' },
    lg: { width: 150, strokeWidth: 8, fontSize: 'text-3xl' },
  };

  const config = sizes[size];
  const radius = (config.width - config.strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (stats.percentage / 100) * circumference;

  const getColor = () => {
    if (stats.percentage >= 75) return 'hsl(var(--success))';
    if (stats.percentage >= 50) return 'hsl(var(--warning))';
    return 'hsl(var(--destructive))';
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: config.width, height: config.width }}>
        <svg className="transform -rotate-90" width={config.width} height={config.width}>
          <circle
            cx={config.width / 2}
            cy={config.width / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={config.strokeWidth}
          />
          <circle
            cx={config.width / 2}
            cy={config.width / 2}
            r={radius}
            fill="none"
            stroke={getColor()}
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-bold ${config.fontSize}`}>{stats.percentage}%</span>
        </div>
      </div>
      {showLabel && (
        <p className="mt-2 text-sm text-muted-foreground">
          {stats.attendedClasses}/{stats.totalClasses} classes
        </p>
      )}
    </div>
  );
}
