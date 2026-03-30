import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Shield, Lock, Mail, Eye, EyeOff, Check, Chrome, Facebook, Apple } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { apiAuth } from "@/lib/api";

type ViewType = 'login' | 'signup' | 'forgot';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentView, setCurrentView] = useState<ViewType>('login');

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Signup state
  const [signupUsername, setSignupUsername] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState(false);

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);

  const [loading, setLoading] = useState(false);

  // Function to reset all form fields
  const resetAllForms = () => {
    // Reset login form
    setLoginEmail("");
    setLoginPassword("");
    setShowLoginPassword(false);
    setRememberMe(false);
    
    // Reset signup form
    setSignupUsername("");
    setSignupEmail("");
    setSignupPassword("");
    setSignupConfirmPassword("");
    setShowSignupPassword(false);
    setShowSignupConfirmPassword(false);
    
    // Reset forgot password form
    setForgotEmail("");
    setResetSent(false);
  };

  const switchView = (newView: ViewType) => {
    // Reset forms when switching views to ensure clean state
    resetAllForms();
    setCurrentView(newView);
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { session } = await apiAuth.getSession();
        if (session && session.user) {
          navigate("/");
          return;
        }
      } catch (err) {
        // no session
      }

      const params = new URLSearchParams(location.search);
      const view = params.get("view");
      if (view === "signup" || view === "forgot") {
        setCurrentView(view);
      } else {
        // Default to login view and reset all forms for clean slate
        resetAllForms();
        setCurrentView("login");
      }
    };
    checkAuth();
  }, [location.search, navigate]);

  const goBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigate("/");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const data = await apiAuth.login({
        email: loginEmail,
        password: loginPassword,
      });

      if (data.success) {
        toast.success("Login successful!");
        navigate("/");
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred during login");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupUsername || !signupEmail || !signupPassword || !signupConfirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (signupPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const data = await apiAuth.register({
        username: signupUsername,
        email: signupEmail,
        password: signupPassword,
      });

      if (data.success) {
        toast.success("Account created successfully! Please sign in.");
        // Use switchView instead of setCurrentView to reset all forms
        switchView('login');
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred during signup");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      toast.error("Please enter your email");
      return;
    }

    setLoading(true);
    try {
      // PHP API doesn't have an email reset configured yet, mock it for now.
      setTimeout(() => {
        setResetSent(true);
        toast.success("Password reset email sent!");
        setLoading(false);
      }, 1000);
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
      setLoading(false);
    }
  };

  const SocialButton = ({ icon: Icon, label, onClick }: { icon: any, label: string, onClick: () => void }) => (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-border/50 rounded-lg bg-card/50 hover:bg-card/80 transition-all duration-200 text-muted-foreground hover:text-foreground"
    >
      <Icon className="w-4 h-4" />
      <span className="text-sm font-medium">{label}</span>
    </button>
  );

  const renderLoginForm = () => (
    <div className="space-y-4">
      {/* Social Login */}
      <div className="space-y-2">
        <SocialButton icon={Chrome} label="Continue with Google" onClick={() => toast.info("Google login not implemented")} />
        <SocialButton icon={Facebook} label="Continue with Facebook" onClick={() => toast.info("Facebook login not implemented")} />
        <SocialButton icon={Apple} label="Continue with Apple" onClick={() => toast.info("Apple login not implemented")} />
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border/50"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">Or continue with email</span>
        </div>
      </div>

      {/* Email Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Email</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="email"
            placeholder="Enter your email"
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
            className="pl-11 h-10 bg-card/50 border-border/50 text-foreground placeholder:text-muted-foreground input-glow rounded-lg"
          />
        </div>
      </div>

      {/* Password Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Password</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type={showLoginPassword ? "text" : "password"}
            placeholder="Enter your password"
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
            className="pl-11 pr-11 h-10 bg-card/50 border-border/50 text-foreground placeholder:text-muted-foreground input-glow rounded-lg"
          />
          <button
            type="button"
            onClick={() => setShowLoginPassword(!showLoginPassword)}
            className={`absolute right-3 top-1/2 -translate-y-1/2 transition-all duration-200 ${
              loginPassword.length > 0 
                ? 'text-muted-foreground hover:text-foreground opacity-100 cursor-pointer' 
                : 'text-muted-foreground opacity-40 pointer-events-none'
            }`}
            disabled={loginPassword.length === 0}
          >
            {showLoginPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Remember me and Forgot password */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="remember"
            checked={rememberMe}
            onCheckedChange={(checked) => setRememberMe(checked as boolean)}
          />
          <label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
            Remember me
          </label>
        </div>
        <button
          type="button"
          onClick={() => switchView('forgot')}
          className="text-sm text-primary hover:text-primary/80 transition-colors"
        >
          Forgot password?
        </button>
      </div>

      {/* Sign In Button */}
      <Button
        type="submit"
        disabled={loading}
        className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg btn-hover transition-all duration-200"
      >
        {loading ? "Signing in..." : "Sign In"}
      </Button>
    </div>
  );

  const renderSignupForm = () => (
    <div className="space-y-4">
      {/* Username Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Username</label>
        <div className="relative">
          <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Choose a username"
            value={signupUsername}
            onChange={(e) => setSignupUsername(e.target.value)}
            className="pl-11 h-10 bg-card/50 border-border/50 text-foreground placeholder:text-muted-foreground input-glow rounded-lg"
          />
        </div>
      </div>

      {/* Email Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Email</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="email"
            placeholder="Enter your email"
            value={signupEmail}
            onChange={(e) => setSignupEmail(e.target.value)}
            className="pl-11 h-10 bg-card/50 border-border/50 text-foreground placeholder:text-muted-foreground input-glow rounded-lg"
          />
        </div>
      </div>

      {/* Password Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Password</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type={showSignupPassword ? "text" : "password"}
            placeholder="Create a password"
            value={signupPassword}
            onChange={(e) => setSignupPassword(e.target.value)}
            className="pl-11 pr-11 h-10 bg-card/50 border-border/50 text-foreground placeholder:text-muted-foreground input-glow rounded-lg"
          />
          <button
            type="button"
            onClick={() => setShowSignupPassword(!showSignupPassword)}
            className={`absolute right-3 top-1/2 -translate-y-1/2 transition-all duration-200 ${
              signupPassword.length > 0 
                ? 'text-muted-foreground hover:text-foreground opacity-100 cursor-pointer' 
                : 'text-muted-foreground opacity-40 pointer-events-none'
            }`}
            disabled={signupPassword.length === 0}
          >
            {showSignupPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Confirm Password Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Confirm Password</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type={showSignupConfirmPassword ? "text" : "password"}
            placeholder="Confirm your password"
            value={signupConfirmPassword}
            onChange={(e) => setSignupConfirmPassword(e.target.value)}
            className="pl-11 pr-11 h-10 bg-card/50 border-border/50 text-foreground placeholder:text-muted-foreground input-glow rounded-lg"
          />
          <button
            type="button"
            onClick={() => setShowSignupConfirmPassword(!showSignupConfirmPassword)}
            className={`absolute right-3 top-1/2 -translate-y-1/2 transition-all duration-200 ${
              signupConfirmPassword.length > 0 
                ? 'text-muted-foreground hover:text-foreground opacity-100 cursor-pointer' 
                : 'text-muted-foreground opacity-40 pointer-events-none'
            }`}
            disabled={signupConfirmPassword.length === 0}
          >
            {showSignupConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Sign Up Button */}
      <Button
        type="submit"
        disabled={loading}
        className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg btn-hover transition-all duration-200"
      >
        {loading ? "Creating account..." : "Create Account"}
      </Button>
    </div>
  );

  const renderForgotForm = () => (
    <div className="space-y-4">
      {resetSent ? (
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <Check className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Check your email</h3>
            <p className="text-muted-foreground text-sm">We've sent a password reset link to your email address.</p>
          </div>
          <Button
            onClick={() => { switchView('login'); setResetSent(false); setForgotEmail(""); }}
            className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg"
          >
            Back to Sign In
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="email"
                placeholder="Enter your email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                className="pl-11 h-10 bg-card/50 border-border/50 text-foreground placeholder:text-muted-foreground input-glow rounded-lg"
              />
            </div>
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </Button>
          <div className="text-center">
            <button
              type="button"
              onClick={() => switchView('login')}
              className="text-sm text-primary hover:text-primary/80 transition-colors"
            >
              ← Back to Sign In
            </button>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="min-h-screen cyber-grid flex items-center justify-center px-4 py-2 relative">
      <button
        onClick={goBack}
        className="absolute top-4 left-4 flex items-center gap-2 text-muted-foreground hover:text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-all duration-200"
      >
        ← Back
      </button>
      <div className="w-full max-w-md animate-fade-in-up">
        {/* Logo */}
        <div className="text-center mb-6 animate-float">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 rounded-2xl mb-3">
            <Shield className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-foreground mb-1">APGS</h1>
          <p className="text-muted-foreground text-sm leading-tight">
            Authentication Protocol<br />Gateway Secure
          </p>
        </div>

        {/* Auth Card */}
        <div className="glass rounded-2xl p-6 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-2">
              {currentView === 'login' && 'Sign in to your account'}
              {currentView === 'signup' && 'Create your account'}
              {currentView === 'forgot' && 'Reset your password'}
            </h2>
          </div>

          {/* Forms */}
          <form onSubmit={currentView === 'login' ? handleLogin : currentView === 'signup' ? handleSignup : handleForgotPassword}>
            {currentView === 'login' && renderLoginForm()}
            {currentView === 'signup' && renderSignupForm()}
            {currentView === 'forgot' && renderForgotForm()}
          </form>

          {/* Footer Links */}
          {currentView !== 'forgot' && !resetSent && (
            <div className="text-center mt-6">
              <p className="text-muted-foreground text-sm">
                {currentView === 'login' ? (
                  <>Don't have an account? <button type="button" onClick={() => switchView('signup')} className="text-primary hover:text-primary/80 font-medium transition-colors">Sign up</button></>
                ) : (
                  <>Already have an account? <button type="button" onClick={() => switchView('login')} className="text-primary hover:text-primary/80 font-medium transition-colors">Sign in</button></>
                )}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
