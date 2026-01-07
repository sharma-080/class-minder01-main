// App.tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";

import { AttendanceProvider } from "@/contexts/AttendanceContext";
import { FirebaseProvider, useFirebase } from "@/contexts/FirebaseContext";

import { Header } from "@/components/Header";
import { MobileNav } from "@/components/MobileNav";

import Index from "./pages/Index";
import Timetable from "./pages/Timetable";
import Subjects from "./pages/Subjects";
import CalendarPage from "./pages/Calendar";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Home from "./pages/Home";
import { DashboardView } from "./components/DashboardView";

// --- PrivateRoute wrapper ---
function PrivateRoute({ children }: { children: JSX.Element }) {
  const { user, loading } = useFirebase();

  if (loading) return <div>Loading...</div>; // Spinner or loader

  return user ? children : <Navigate to="/login" replace />;
}

// --- Layout wrapper ---
function Layout({ children }: { children: JSX.Element }) {
  const { user } = useFirebase();
  const location = useLocation();

  // Hide header on public pages
  const hideHeader = ["/", "/login", "/signup"].includes(location.pathname);

  return (
    <div className="min-h-screen flex flex-col">
      {!hideHeader && <Header />}
      <main className="flex-1">{children}</main>
      <MobileNav />
    </div>
  );
}

// --- App component ---
const App = () => {
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <FirebaseProvider>
        <TooltipProvider>
          <AttendanceProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Layout>
                <Routes>
                  {/* Public pages */}
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<SignUp />} />

                  {/* Protected pages */}
                  <Route
                    path="/dashboard"
                    element={
                      <PrivateRoute>
                        <DashboardView />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/index"
                    element={
                      <PrivateRoute>
                        <Index />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/timetable"
                    element={
                      <PrivateRoute>
                        <Timetable />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/subjects"
                    element={
                      <PrivateRoute>
                        <Subjects />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/calendar"
                    element={
                      <PrivateRoute>
                        <CalendarPage />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <PrivateRoute>
                        <Settings />
                      </PrivateRoute>
                    }
                  />

                  {/* 404 */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Layout>
            </BrowserRouter>
          </AttendanceProvider>
        </TooltipProvider>
      </FirebaseProvider>
    </QueryClientProvider>
  );
};

export default App;
