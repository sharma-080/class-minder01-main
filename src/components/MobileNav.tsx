import { Link, useLocation } from 'react-router-dom';
import { Home, Calendar, BookOpen, CalendarDays, Settings } from 'lucide-react';

export function MobileNav() {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/timetable', label: 'Timetable', icon: Calendar },
    { path: '/subjects', label: 'Subjects', icon: BookOpen },
    { path: '/calendar', label: 'Calendar', icon: CalendarDays },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden">
      <div className="flex justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-1 flex-col items-center py-2 text-xs ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Icon className="h-5 w-5 mb-1" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
