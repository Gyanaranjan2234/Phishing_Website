import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Shield, Mail, Link, Lock, CheckCircle, AlertTriangle, 
  Smartphone, Eye, Key, Globe, UserCheck, FileWarning,
  ArrowLeft, User, LogOut, Menu, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { apiAuth } from "@/lib/api-backend";

const Prevention = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const [userId, setUserId] = useState<number | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">(() => 
    localStorage.getItem("apgs-theme") === "light" ? "light" : "dark"
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { session } = await apiAuth.getSession();
        if (session?.user) {
          setUserName(session.user.username || session.user.email || "");
          setUserEmail(session.user.email || "");
          setUserId(Number(session.user.id));
        }
      } catch (err) {
        console.error("Auth check failed:", err);
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("apgs-theme", theme);
  }, [theme]);

  const handleLogout = async () => {
    await apiAuth.logout();
    navigate("/");
  };

  const preventionCards = [
    {
      icon: Smartphone,
      title: "Multi-Factor Authentication (MFA)",
      subtitle: "Add an extra layer of security",
      color: "from-primary/20 to-cyan-500/20",
      borderColor: "border-primary/30",
      iconColor: "text-primary",
      hoverBorder: "hover:border-primary/50",
      hoverShadow: "hover:shadow-[0_8px_30px_rgba(0,255,136,0.15)]",
      points: [
        "Enable MFA on all important accounts (email, banking, social media)",
        "Use authenticator apps (Google Authenticator, Authy) instead of SMS",
        "Keep backup codes in a secure location for account recovery"
      ]
    },
    {
      icon: UserCheck,
      title: "Out-of-Band Verification",
      subtitle: "Verify through separate channels",
      color: "from-cyan-400/20 to-blue-500/20",
      borderColor: "border-cyan-400/30",
      iconColor: "text-cyan-400",
      hoverBorder: "hover:border-cyan-400/50",
      hoverShadow: "hover:shadow-[0_8px_30px_rgba(0,212,255,0.15)]",
      points: [
        "Verify suspicious requests by contacting the person directly",
        "Use a different communication channel (call instead of email)",
        "Never trust urgent requests asking for sensitive information"
      ]
    },
    {
      icon: Eye,
      title: "URL & Certificate Inspection",
      subtitle: "Check before you click",
      color: "from-blue-500/20 to-purple-500/20",
      borderColor: "border-blue-500/30",
      iconColor: "text-blue-500",
      hoverBorder: "hover:border-blue-500/50",
      hoverShadow: "hover:shadow-[0_8px_30px_rgba(59,130,246,0.15)]",
      points: [
        "Hover over links to preview the actual URL before clicking",
        "Check for HTTPS and valid SSL certificates on sensitive sites",
        "Look for misspellings or unusual domain extensions in URLs"
      ]
    },
    {
      icon: Key,
      title: "Password Managers",
      subtitle: "Secure password generation & storage",
      color: "from-purple-500/20 to-pink-500/20",
      borderColor: "border-purple-500/30",
      iconColor: "text-purple-500",
      hoverBorder: "hover:border-purple-500/50",
      hoverShadow: "hover:shadow-[0_8px_30px_rgba(168,85,247,0.15)]",
      points: [
        "Use unique, strong passwords for every account",
        "Let the password manager generate complex passwords automatically",
        "Enable auto-fill to avoid typing passwords on suspicious sites"
      ]
    }
  ];

  const safetyTips = [
    { icon: Shield, text: "Keep software and antivirus updated" },
    { icon: Mail, text: "Don't open attachments from unknown senders" },
    { icon: Globe, text: "Use secure, encrypted connections (HTTPS)" },
    { icon: Lock, text: "Lock your devices when not in use" },
    { icon: Eye, text: "Regularly monitor account activity" },
    { icon: AlertTriangle, text: "Report suspicious emails immediately" }
  ];

  const commonMistakes = [
    {
      title: "Clicking Urgent Links",
      description: "Phishers create fake urgency to bypass your critical thinking",
      icon: AlertTriangle,
      color: "text-red-400"
    },
    {
      title: "Reusing Passwords",
      description: "One breach can compromise all your accounts with the same password",
      icon: Key,
      color: "text-orange-400"
    },
    {
      title: "Ignoring URL Details",
      description: "Small changes in URLs (paypa1.com vs paypal.com) indicate fraud",
      icon: Link,
      color: "text-yellow-400"
    },
    {
      title: "Trusting Email Display Names",
      description: "Display names can be easily spoofed - always check the actual email address",
      icon: Mail,
      color: "text-blue-400"
    }
  ];

  return (
    <div className="min-h-screen text-foreground transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-lg relative">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          {/* LEFT SIDE - Back button + Logo */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="gap-2 text-muted-foreground hover:text-primary"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Home</span>
            </Button>
            <div className="h-6 w-px bg-border hidden sm:block"></div>
            <div className="flex items-center gap-2">
              <img
                src="/apgs-logo.png"
                alt="APGS Logo"
                width="40"
                height="40"
                className="h-10 w-10 object-contain"
                style={{ filter: 'drop-shadow(0 0 6px rgba(0, 255, 156, 0.2))' }}
              />
              <div className="flex flex-col">
                <div className="font-heading font-bold text-primary text-lg">APGS</div>
                <div className="text-xs text-muted-foreground hidden sm:block">Prevention Guide</div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE - Toggle + Profile + Hamburger */}
          <div className="flex items-center gap-3">
            {/* DESKTOP CONTROLS - Hidden on mobile */}
            <div className="hidden md:flex items-center gap-3">
              <span className="text-xs text-muted-foreground">{theme === "dark" ? "🌙" : "☀️"}</span>
              <Switch
                checked={theme === "light"}
                onCheckedChange={(checked) => setTheme(checked ? "light" : "dark")}
              />
            </div>
            
            {userId && (
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card/80 hover:bg-card/90 transition">
                  <User className="w-4 h-4 text-primary" />
                  <span className="hidden sm:inline">{userName || "Profile"}</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-card border border-border">
                  <DropdownMenuItem onSelect={() => navigate("/dashboard")}>
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={handleLogout} className="text-red-400">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          
          {/* MOBILE HAMBURGER BUTTON */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-10 h-10 rounded-lg border border-border/50 bg-card/50 hover:border-primary/50 hover:bg-primary/10 transition-all duration-300 flex items-center justify-center"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-foreground" />
              ) : (
                <Menu className="w-5 h-5 text-foreground" />
              )}
            </button>
          </div>
        </div>

        {/* MOBILE DROPDOWN MENU - Absolute positioned overlay */}
        {mobileMenuOpen && (
          <div 
            className="md:hidden absolute top-full left-0 w-full bg-[#0b0f1a] border-t border-border/50 shadow-2xl z-[1000]"
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              width: '100%',
              zIndex: 1000
            }}
          >
            {/* USER PROFILE SECTION - Only show when authenticated */}
            {userId && (
              <div className="max-w-7xl mx-auto px-6 py-4 border-b border-border/50">
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-primary/10 to-cyan-500/10 border border-primary/30">
                  {/* Avatar */}
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center text-primary-foreground font-bold text-lg border-2 border-primary/50">
                    {(userName || "U").charAt(0).toUpperCase()}
                  </div>
                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">
                      {userName || "User"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {userEmail || "user@example.com"}
                    </p>
                  </div>
                  {/* Profile & Logout Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { navigate("/profile"); setMobileMenuOpen(false); }}
                      className="px-3 py-2 rounded-lg border border-primary/50 text-primary hover:bg-primary/20 transition-all duration-200 text-sm font-medium"
                    >
                      Profile
                    </button>
                    <button
                      onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                      className="px-3 py-2 rounded-lg border border-red-500/50 text-red-400 hover:bg-red-500/20 transition-all duration-200 text-sm font-medium"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            <nav className="max-w-7xl mx-auto px-6 py-4 space-y-2">
              <button
                onClick={() => { navigate("/"); setMobileMenuOpen(false); }}
                className="w-full text-left px-4 py-3 rounded-lg border border-border text-foreground hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 min-h-[44px]"
              >
                Home
              </button>
              <button
                onClick={() => { navigate("/scanning"); setMobileMenuOpen(false); }}
                className="w-full text-left px-4 py-3 rounded-lg border border-border text-foreground hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 min-h-[44px]"
              >
                Scanning
              </button>
              <button
                onClick={() => { setMobileMenuOpen(false); }}
                className="w-full text-left px-4 py-3 rounded-lg border border-primary text-primary bg-primary/10 transition-all duration-200 font-medium min-h-[44px]"
              >
                Prevention
              </button>
              {userId && (
                <button
                  onClick={() => { navigate("/quiz"); setMobileMenuOpen(false); }}
                  className="w-full text-left px-4 py-3 rounded-lg border border-border text-foreground hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 min-h-[44px]"
                >
                  Security Quiz
                </button>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12 space-y-16">
        {/* Hero Section */}
        <section className="text-center space-y-6 px-4">
          <h1 
            className="font-heading font-bold bg-gradient-to-r from-primary via-cyan-400 to-blue-500 bg-clip-text text-transparent"
            style={{
              fontSize: 'clamp(1.75rem, 6vw, 3.75rem)',
              lineHeight: '1.2',
              wordBreak: 'break-word',
              overflowWrap: 'break-word'
            }}
          >
            How to Prevent Phishing Attacks
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
            Stay protected with proven security practices. Learn essential techniques to identify and prevent phishing attempts before they compromise your data.
          </p>
        </section>

        {/* Main Prevention Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {preventionCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div
                key={index}
                className={`group relative overflow-hidden rounded-2xl border ${card.borderColor} bg-white/5 backdrop-blur-xl p-8 transition-all duration-300 hover:-translate-y-1 ${card.hoverBorder} ${card.hoverShadow}`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                <div className="relative z-10">
                  <div className="flex items-start gap-4 mb-6">
                    <div className={`flex-shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br ${card.color} border ${card.borderColor} flex items-center justify-center`}>
                      <Icon className={`w-8 h-8 ${card.iconColor}`} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-heading font-bold text-foreground mb-1">{card.title}</h3>
                      <p className="text-sm text-muted-foreground">{card.subtitle}</p>
                    </div>
                  </div>
                  <ul className="space-y-4">
                    {card.points.map((point, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <CheckCircle className={`w-5 h-5 ${card.iconColor} flex-shrink-0 mt-0.5`} />
                        <span className="text-sm text-muted-foreground leading-relaxed">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </section>

        {/* Quick Safety Tips */}
        <section className="space-y-8">
          <div className="text-center space-y-3 px-4">
            <h2 
              className="font-heading font-bold text-foreground"
              style={{
                fontSize: 'clamp(1.5rem, 5vw, 2.25rem)',
                lineHeight: '1.2',
                wordBreak: 'break-word',
                overflowWrap: 'break-word'
              }}
            >
              Quick Safety Tips
            </h2>
            <p className="text-muted-foreground">Essential habits to maintain digital security</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {safetyTips.map((tip, index) => {
              const Icon = tip.icon;
              return (
                <div
                  key={index}
                  className="flex items-center gap-4 p-5 rounded-xl border border-border bg-card/50 hover:bg-card/70 hover:border-primary/30 transition-all duration-200 hover:scale-105"
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-sm font-medium text-foreground">{tip.text}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Common Mistakes to Avoid */}
        <section className="space-y-8">
          <div className="text-center space-y-3 px-4">
            <h2 
              className="font-heading font-bold text-foreground"
              style={{
                fontSize: 'clamp(1.5rem, 5vw, 2.25rem)',
                lineHeight: '1.2',
                wordBreak: 'break-word',
                overflowWrap: 'break-word'
              }}
            >
              Common Mistakes to Avoid
            </h2>
            <p className="text-muted-foreground">Learn from these frequent security errors</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {commonMistakes.map((mistake, index) => {
              const Icon = mistake.icon;
              return (
                <div
                  key={index}
                  className="p-6 rounded-xl border border-border bg-card/50 hover:bg-card/70 transition-all duration-200"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <Icon className={`w-8 h-8 ${mistake.color}`} />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-heading font-bold text-foreground">{mistake.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{mistake.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 via-cyan-500/5 to-blue-500/10 p-12 text-center space-y-6">
          <div className="relative z-10 px-4">
            <h2 
              className="font-heading font-bold text-foreground mb-4"
              style={{
                fontSize: 'clamp(1.5rem, 5vw, 2.25rem)',
                lineHeight: '1.2',
                wordBreak: 'break-word',
                overflowWrap: 'break-word'
              }}
            >
              Test Your Security Knowledge
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
              Use our scanning tools to check URLs, emails, files, and passwords for potential threats.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button
                onClick={() => navigate("/scanning")}
                className="px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg transition-all duration-300 hover:scale-105"
              >
                Start Scanning Now
              </Button>
              <Button
                onClick={() => navigate("/")}
                variant="outline"
                className="px-8 py-3 border-primary text-primary hover:bg-primary/20 font-semibold rounded-lg transition-all duration-300 hover:scale-105"
              >
                Return to Home
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 mt-16">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center">
          <p className="text-muted-foreground text-sm">
            © 2024 APGS - Advanced Phishing Guard System. Stay safe online.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Prevention;
