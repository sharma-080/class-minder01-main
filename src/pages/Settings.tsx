import { useState, useEffect } from 'react';
import { useAttendance } from '@/contexts/AttendanceContext';
import { useNotifications } from '@/hooks/useNotifications';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Bell, Moon, Sun, Trash2, User } from 'lucide-react';
import { useFirebase } from '@/contexts/FirebaseContext';

export default function Settings() {
  const {
    theme,
    toggleTheme,
    notificationSettings,
    updateNotificationSettings,
    timetables,
    deleteTimetable,
    userName,
    setUserName,
  } = useAttendance();

  const { requestPermission, isSupported, permission } = useNotifications();
  const { user, logout } = useFirebase();

  // Local input state
  const [nameInput, setNameInput] = useState(userName);

  // Sync input with context
  useEffect(() => {
    setNameInput(userName);
  }, [userName]);

  // Save display name
  const handleSaveName = async () => {
    const trimmed = nameInput.trim() || 'Student';
    await setUserName(trimmed);
  };

  // Enable notifications
  const handleEnableNotifications = async () => {
    const granted = await requestPermission();
    if (granted) await updateNotificationSettings({ enabled: true });
  };

  // Logout
  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  return (
    <div className="container max-w-screen-xl py-6 px-4">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <div className="space-y-6">
        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" /> Profile
            </CardTitle>
            <CardDescription>Your display name</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2 items-center">
            <Input
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              placeholder="Enter your name"
            />
            <Button onClick={handleSaveName}>Save</Button>
          </CardContent>
        </Card>

        {/* Theme */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {theme === 'light' ? <Sun /> : <Moon />} Theme
            </CardTitle>
            <CardDescription>Toggle light/dark mode</CardDescription>
          </CardHeader>
          <CardContent>
            <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell /> Notifications
            </CardTitle>
            <CardDescription>Receive class reminders</CardDescription>
          </CardHeader>
          <CardContent>
            {isSupported ? (
              notificationSettings.enabled ? (
                <p>Notifications enabled ✅</p>
              ) : (
                <Button onClick={handleEnableNotifications}>Enable Notifications</Button>
              )
            ) : (
              <p>Your browser does not support notifications.</p>
            )}
          </CardContent>
        </Card>

        {/* Timetables */}
        <Card>
          <CardHeader>
            <CardTitle>Timetables</CardTitle>
            <CardDescription>Manage your timetables</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {timetables.map(t => (
              <div key={t.id} className="flex justify-between items-center">
                <span>{t.name} {t.isActive && '(Active)'}</span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteTimetable(t.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Logout */}
        <Button variant="destructive" onClick={handleLogout}>Logout</Button>
      </div>
    </div>
  );
}
