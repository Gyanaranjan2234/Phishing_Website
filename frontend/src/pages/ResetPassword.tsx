import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { apiAuth } from "@/lib/api-backend";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      toast.error("Invalid or missing reset token.");
      navigate("/login");
    }
  }, [token, navigate]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      toast.error("Please fill in all fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    if (!token) return;

    setLoading(true);
    try {
      const data = await apiAuth.resetPassword(token, newPassword);

      if (data.status === 'success') {
        toast.success(data.message || "Password updated successfully!");
        navigate("/login");
      } else {
        toast.error(data.message || "Failed to reset password.");
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) return null;

  return (
    <div className="min-h-screen cyber-grid flex items-center justify-center px-4 py-2 relative">
      <div className="w-full max-w-md animate-fade-in-up">
        {/* Logo */}
        <div className="text-center mb-6 animate-float">
          <div className="flex flex-col items-center gap-2">
            <img src="/apgs-logo.png" alt="APGS Logo" className="h-10 w-auto" />
            <h1 className="text-xl font-bold text-foreground mb-1">APGS</h1>
            <p className="text-muted-foreground text-sm leading-tight">
              Advanced Phishing Guard System
            </p>
          </div>
        </div>

        {/* Auth Card */}
        <div className="glass rounded-2xl p-6 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Create New Password
            </h2>
            <p className="text-muted-foreground text-sm">
              Please enter your new strong password below.
            </p>
          </div>

          <form onSubmit={handleReset} className="space-y-4">
            {/* New Password Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pl-11 pr-11 h-10 bg-card/50 border-border/50 text-foreground placeholder:text-muted-foreground input-glow rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 transition-all duration-200 ${
                    newPassword.length > 0 
                      ? 'text-muted-foreground hover:text-foreground opacity-100 cursor-pointer' 
                      : 'text-muted-foreground opacity-40 pointer-events-none'
                  }`}
                  disabled={newPassword.length === 0}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Confirm New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-11 pr-11 h-10 bg-card/50 border-border/50 text-foreground placeholder:text-muted-foreground input-glow rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 transition-all duration-200 ${
                    confirmPassword.length > 0 
                      ? 'text-muted-foreground hover:text-foreground opacity-100 cursor-pointer' 
                      : 'text-muted-foreground opacity-40 pointer-events-none'
                  }`}
                  disabled={confirmPassword.length === 0}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg btn-hover transition-all duration-200"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </Button>
          </form>

          <div className="text-center mt-6">
            <button
              onClick={() => navigate("/login")}
              className="text-sm text-primary hover:text-primary/80 transition-colors"
            >
              ← Back to Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
