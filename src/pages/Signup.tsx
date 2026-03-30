import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Shield, Lock, Mail, User, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const Signup = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");

  const goBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigate("/");
    }
  };
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      localStorage.setItem("apgs-auth", "true");
      toast.success("Account created successfully");
      navigate("/");
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center cyber-grid px-4 relative">
      <Button
        onClick={goBack}
        variant="ghost"
        className="absolute top-4 left-4 flex items-center gap-2 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Button>
      <div className="w-full max-w-md animate-fade-in-up">
        <div className="flex items-center justify-center gap-3 mb-8">
          <Shield className="w-10 h-10 text-primary" />
          <h1 className="text-3xl font-heading font-bold text-primary">APGS</h1>
        </div>
        <div className="bg-card border border-border rounded-lg p-8">
          <h2 className="text-xl font-heading font-semibold text-foreground mb-1">Create Account</h2>
          <p className="text-muted-foreground text-sm mb-6">Join the security network</p>
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input type="text" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} className="pl-10 bg-muted border-border text-foreground placeholder:text-muted-foreground" />
            </div>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 bg-muted border-border text-foreground placeholder:text-muted-foreground" />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input type={showPassword ? "text" : "password"} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10 bg-muted border-border text-foreground placeholder:text-muted-foreground" />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)} 
                className={`absolute right-3 top-1/2 -translate-y-1/2 transition-all duration-200 ${
                  password.length > 0 
                    ? 'text-muted-foreground hover:text-foreground opacity-100 cursor-pointer' 
                    : 'text-muted-foreground opacity-40 pointer-events-none'
                }`}
                disabled={password.length === 0}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-heading font-semibold animate-pulse-glow">
              {loading ? "Creating account..." : "Sign Up"}
            </Button>
          </form>
          <p className="text-center text-muted-foreground text-sm mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
