// src/pages/Login.tsx
import { useState } from "react";
import { useFirebase } from "@/contexts/FirebaseContext";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarClock } from "lucide-react";
import { FaGoogle } from "react-icons/fa";

const Login = () => {
  const { login, loginWithGoogle, user } = useFirebase();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Email/Password login
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || "Login failed. Check your email and password.");
    } finally {
      setLoading(false);
    }
  };

  // Google login
  const handleGoogleLogin = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setError(err.message || "Google login failed.");
    } finally {
      setGoogleLoading(false);
    }
  };

  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md text-center space-y-6 animate-fade-in-up">
        {/* Brand icon */}
        <div className="mx-auto bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center rotate-3">
          <CalendarClock className="w-8 h-8 text-primary" />
        </div>

        {/* Brand title */}
        <h1 className="text-4xl font-display font-bold tracking-tight">
          Attendify
        </h1>

        <p className="text-muted-foreground">
          Login to manage your attendance effortlessly
        </p>

        {/* Login card */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-center text-xl font-bold">
              Login
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </Button>
            </form>

            {/* OR divider */}
            <div className="flex items-center my-4">
              <hr className="flex-grow border-t border-muted" />
              <span className="px-2 text-muted-foreground text-sm">or</span>
              <hr className="flex-grow border-t border-muted" />
            </div>

            {/* Google login */}
            <Button
              variant="secondary"
              className="w-full flex items-center justify-center gap-2"
              onClick={handleGoogleLogin}
              disabled={googleLoading}
            >
              <FaGoogle className="w-5 h-5" />
              {googleLoading ? "Signing in..." : "Sign in with Google"}
            </Button>

            <div className="mt-4 text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <a href="/signup" className="text-primary hover:underline">
                Sign Up
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
