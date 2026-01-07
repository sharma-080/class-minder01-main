// /src/components/dashboard/DashboardView.tsx
import { useEffect, useState, useMemo } from "react";
import { format, differenceInMinutes, parse } from "date-fns";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from "recharts";
import { Clock, Calendar, Sparkles, Bell, AlertCircle, Undo2 } from "lucide-react";
import { motion } from "framer-motion";

import { useAttendance } from "@/contexts/AttendanceContext";
import { SUBJECT_COLORS } from "@/types/attendance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function DashboardView() {
  const {
    scheduledClasses,
    subjects,
    userName,
    getSubjectById,
    updateClassStatus,
    markAttendance,
    markTodayAsHoliday,
    resetClassStatus,
    resetAttendance,
    getAttendanceStats,
  } = useAttendance();

  const now = new Date();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  // -------------------------
  // Deduplicate today's classes and sort by start time
  // -------------------------
  const todayClasses = useMemo(() => {
    const today = format(now, "yyyy-MM-dd");

    const classesToday = scheduledClasses.filter(c => c.date === today);

    // Remove exact duplicates by subject + startTime + date
    const uniqueClasses = Array.from(
      new Map(classesToday.map(c => [`${c.subjectId}-${c.startTime}-${c.date}`, c])).values()
    );

    // Sort by startTime
    uniqueClasses.sort((a, b) => a.startTime.localeCompare(b.startTime));

    return uniqueClasses;
  }, [scheduledClasses, now]);

  // -------------------------
  // Upcoming class
  // -------------------------
  const upcomingClass = useMemo(() => {
    const futureClasses = scheduledClasses
      .filter(c => {
        const classTime = parse(`${c.date} ${c.startTime}`, 'yyyy-MM-dd HH:mm', new Date());
        return classTime > now && c.status === "scheduled";
      })
      .sort((a, b) => {
        const aTime = parse(`${a.date} ${a.startTime}`, 'yyyy-MM-dd HH:mm', new Date());
        const bTime = parse(`${b.date} ${b.startTime}`, 'yyyy-MM-dd HH:mm', new Date());
        return aTime.getTime() - bTime.getTime();
      });

    return futureClasses[0] || null;
  }, [scheduledClasses, now]);

  const upcomingSubject = upcomingClass ? getSubjectById(upcomingClass.subjectId) : null;

  // -------------------------
  // Notifications
  // -------------------------
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "granted") {
      setNotificationsEnabled(true);
    }
  }, []);

  const requestNotification = async () => {
    if (!("Notification" in window)) return alert("Notifications not supported");
    if (Notification.permission === "denied") return alert("Enable notifications in browser settings");

    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      setNotificationsEnabled(true);
      new Notification("Notifications Enabled!", {
        body: "You will now receive class reminders.",
        icon: '/favicon.ico'
      });
    }
  };

  const getTimeUntilClass = () => {
    if (!upcomingClass) return null;
    const classTime = parse(`${upcomingClass.date} ${upcomingClass.startTime}`, 'yyyy-MM-dd HH:mm', new Date());
    const minutes = differenceInMinutes(classTime, now);
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const overallStats = getAttendanceStats();
  const simpleChartData = [
    { name: "Attended", value: overallStats.attendedClasses, color: "#22c55e" },
    { name: "Missed", value: overallStats.missedClasses, color: "#ef4444" },
    { name: "Total", value: overallStats.totalClasses - overallStats.attendedClasses - overallStats.missedClasses, color: "#94a3b8" }
  ];
  const totalClasses = simpleChartData.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold text-foreground">Welcome back, {userName}!</h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            <Calendar className="w-4 h-4" /> {format(now, "EEEE, MMMM do, yyyy")}
          </p>
        </div>
        <div className="flex gap-2">
          {!notificationsEnabled && (
            <Button onClick={requestNotification} variant="outline" className="flex items-center gap-2 px-4 py-2 bg-accent/10 text-accent rounded-full text-sm font-medium hover:bg-accent/20 transition-colors h-9">
              <Bell className="w-4 h-4" /> Enable Class Reminders
            </Button>
          )}
          {todayClasses.length > 0 && (
            <Button size="sm" variant="destructive" onClick={() => markTodayAsHoliday()}>
              Mark All Today as Holiday
            </Button>
          )}
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Today's Classes */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-500" /> Today's Classes
            </h2>
            <span className="text-sm font-medium bg-primary/10 text-primary px-3 py-1 rounded-full">
              {todayClasses.length} Classes
            </span>
          </div>

          {todayClasses.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-2xl border border-dashed border-border/60">
              <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg">No classes today</h3>
              <p className="text-muted-foreground">Enjoy your free time!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayClasses.map(classItem => {
                const subject = getSubjectById(classItem.subjectId);
                if (!subject) return null;

                return (
                  <div
                    key={`${classItem.subjectId}-${classItem.startTime}-${classItem.date}`}
                    className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-lg border-l-4 ${SUBJECT_COLORS[subject.color].border} bg-muted/50`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${SUBJECT_COLORS[subject.color].bg}`} />
                      <div>
                        <p className="font-medium">{subject.name}</p>
                        <p className="text-sm text-muted-foreground">{classItem.startTime} - {classItem.endTime}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-0">
                      {/* Cancel / Holiday Status */}
                      {["cancelled", "holiday"].includes(classItem.status) && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-destructive">
                            {classItem.status === "cancelled" ? "Cancelled" : "Holiday"}
                          </span>
                          <Button size="sm" variant="ghost" onClick={() => resetClassStatus(classItem.id)} title="Undo">
                            <Undo2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}

                      {/* Attendance */}
                      {classItem.attended === null && classItem.status === "scheduled" && (
                        <>
                          <Button size="sm" variant="default" onClick={() => markAttendance(classItem.id, true)}>Attended</Button>
                          <Button size="sm" variant="destructive" onClick={() => markAttendance(classItem.id, false)}>Absent</Button>
                        </>
                      )}
                      {classItem.attended !== null && (
                        <div className="flex items-center gap-2">
                          <span className={`text-sm ${classItem.attended ? "text-success" : "text-destructive"}`}>
                            {classItem.attended ? "✓ Attended" : "✗ Absent"}
                          </span>
                          <Button size="sm" variant="ghost" onClick={() => resetAttendance(classItem.id)} title="Undo">
                            <Undo2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}

                      {/* Cancel button */}
                      {classItem.status === "scheduled" && (
                        <Button size="sm" variant="outline" onClick={() => updateClassStatus(classItem.id, "cancelled")}>
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column - Analytics and Upcoming Class */}
        <div className="space-y-6">
          {/* Pie Chart */}
          <Card className="border-border/60 shadow-lg shadow-primary/5">
            <CardHeader>
              <CardTitle className="text-lg">Attendance Rate</CardTitle>
            </CardHeader>
            <CardContent>
              {totalClasses === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center p-4">
                  <AlertCircle className="w-8 h-8 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No attendance data yet.</p>
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={simpleChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {simpleChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Subject Breakdown */}
          {subjects.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Subject Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {subjects.map(subject => {
                    const stats = getAttendanceStats(subject.id);
                    if (!stats.totalClasses) return null;
                    return (
                      <div key={subject.id} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{subject.name}</span>
                          <span className={stats.percentage >= 75 ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                            {stats.percentage}%
                          </span>
                        </div>
                        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${stats.percentage}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className={`h-full rounded-full ${stats.percentage >= 75 ? "bg-green-500" : "bg-red-500"}`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Upcoming Class */}
          {upcomingClass && upcomingSubject && (
            <Card className={`border-l-4 ${SUBJECT_COLORS[upcomingSubject.color].border}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" /> Next Class
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">{upcomingSubject.name}</h3>
                    <p className="text-muted-foreground">{upcomingClass.startTime} - {upcomingClass.endTime}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{getTimeUntilClass()}</p>
                    <p className="text-sm text-muted-foreground">until class</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
