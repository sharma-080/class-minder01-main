import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Button } from "@/components/ui/button";
import { CalendarClock, ShieldCheck } from "lucide-react";

export default function Home() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 bg-muted rounded-full mb-4" />
          <div className="h-4 w-32 bg-muted rounded" />
        </div>
      </div>
    );
  }

  // Redirect logged-in users
  if (user) {
    return <Redirect to="/dashboard" />;
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/5 rounded-full blur-3xl" />
      </div>

      {/* 🔹 Top Navbar */}
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2 font-bold text-lg">
          <CalendarClock className="w-6 h-6 text-primary" />
          Attendify
        </div>

        <nav className="flex items-center gap-6 text-sm text-muted-foreground">
          <a href="#guide" className="hover:text-foreground transition">
            Guide
          </a>
          <a href="#help" className="hover:text-foreground transition">
            Help
          </a>
          <a href="/login">
            <Button size="sm" variant="outline">
              Login
            </Button>
          </a>
          <a href="/signup">
            <Button size="sm">
              Sign Up
            </Button>
          </a>
        </nav>
      </header>

      {/* 🔹 Hero Section */}
      <main className="flex flex-col items-center justify-center px-4 pt-24 pb-32">
        <div className="text-center max-w-2xl mx-auto space-y-8 animate-fade-in-up">
          <div className="mx-auto bg-primary/10 w-20 h-20 rounded-2xl flex items-center justify-center rotate-3">
            <CalendarClock className="w-10 h-10 text-primary" />
          </div>

          <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight">
            Attendify
          </h1>

          <p className="text-xl text-muted-foreground leading-relaxed">
            The smart attendance tracker for students. Schedule your classes,
            track your presence, and never miss a lecture again.
          </p>

          <div className="flex gap-4 justify-center pt-4">
            <a href="/signup">
              <Button
                size="lg"
                className="h-14 px-8 text-lg rounded-full shadow-lg shadow-primary/25 hover:shadow-xl transition-all hover:-translate-y-1"
              >
                Get Started
              </Button>
            </a>
          </div>

          {/* 🔹 Features */}
          <div className="pt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div className="p-6 bg-card rounded-xl border shadow-sm">
              <ShieldCheck className="w-8 h-8 text-primary mb-3" />
              <h3 className="font-bold text-lg mb-1">Smart Tracking</h3>
              <p className="text-sm text-muted-foreground">
                Automatically calculates your attendance percentage.
              </p>
            </div>

            <div className="p-6 bg-card rounded-xl border shadow-sm">
              <CalendarClock className="w-8 h-8 text-accent mb-3" />
              <h3 className="font-bold text-lg mb-1">Schedule Builder</h3>
              <p className="text-sm text-muted-foreground">
                Input your weekly timetable and generate months of classes.
              </p>
            </div>

            <div className="p-6 bg-card rounded-xl border shadow-sm">
              <div className="w-8 h-10 bg-green-500/10 rounded-full flex items-center justify-center mb-3 text-green-600 font-bold">
                %
              </div>
              <h3 className="font-bold text-lg mb-1">Analytics</h3>
              <p className="text-sm text-muted-foreground">
                Visual charts to keep you on top of your academic goals.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
