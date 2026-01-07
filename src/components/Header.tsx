import { Link, useLocation } from 'react-router-dom';
import { Moon, Sun, Bell, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAttendance } from '@/contexts/AttendanceContext';
import { useNotifications } from '@/hooks/useNotifications';
import { useFirebase } from '@/contexts/FirebaseContext'; // to get user state

export function Header() {
  const { theme, toggleTheme, notificationSettings, updateNotificationSettings } = useAttendance();
  const { requestPermission, isSupported } = useNotifications();
  const { user } = useFirebase(); // get current user
  const location = useLocation();

  const handleToggleNotifications = async () => {
    if (!notificationSettings.enabled) {
      const granted = await requestPermission();
      if (granted) {
        updateNotificationSettings({ enabled: true });
      }
    } else {
      updateNotificationSettings({ enabled: false });
    }
  };

  // Show full nav only if logged in
  const navItems = user
    ? [
        { path: '/dashboard', label: 'Dashboard' },
        { path: '/timetable', label: 'Timetable' },
        { path: '/subjects', label: 'Subjects' },
        { path: '/calendar', label: 'Calendar' },
        { path: '/settings', label: 'Settings' },
      ]
    : []; // no nav links if not logged in

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center px-4">
        {/* Logo */}
        <div className="mr-4 flex items-center">
          <Link to="/" className="mr-6 flex items-center space-x-2">
            <span className="text-lg font-bold">Attendify</span>
          </Link>

          {/* Navigation */}
          {user && (
            <nav className="hidden md:flex items-center gap-6 text-sm">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`transition-colors hover:text-foreground/80 ${
                    location.pathname === item.path
                      ? 'text-foreground font-medium'
                      : 'text-foreground/60'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          )}
        </div>

        {/* Right side buttons */}
        <div className="flex flex-1 items-center justify-end space-x-2">
          {user && isSupported && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleNotifications}
              title={notificationSettings.enabled ? 'Disable reminders' : 'Enable reminders'}
            >
              {notificationSettings.enabled ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
              <span className="sr-only">Toggle notifications</span>
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* Login/Signup if not logged in */}
          {!user && (
            <div className="hidden md:flex gap-2 ml-4">
              <Link to="/login" className="text-sm font-medium text-primary hover:underline">
                Login
              </Link>
              <Link to="/signup" className="text-sm font-medium text-primary hover:underline">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
