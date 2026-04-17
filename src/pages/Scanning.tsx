import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Globe, FileText, Mail, Lock, ShieldCheck, Zap, Users, Phone, Loader2, User, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import { apiAuth, apiScans } from "@/lib/api";
import UrlScanner from "@/components/dashboard/UrlScanner";
import EmailBreachChecker from "@/components/dashboard/EmailBreachChecker";
import FileScanner from "@/components/dashboard/FileScanner";
import PasswordChecker from "@/components/dashboard/PasswordChecker";
import ActivityHistory from "@/components/dashboard/ActivityHistory";

const Scanning = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [theme, setTheme] = useState<"dark" | "light">(() => (localStorage.getItem("apgs-theme") === "light" ? "light" : "dark"));
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userName, setUserName] = useState<string>("");
  
  // Scan state management - preserved across tab switches
  const [urlScanData, setUrlScanData] = useState({ input: "", result: null as any });
  const [emailScanData, setEmailScanData] = useState({ input: "", result: null as any });
  const [fileScanData, setFileScanData] = useState({ file: null as File | null, result: null as any });
  const [passwordScanData, setPasswordScanData] = useState({ input: "", result: null as any });
  
  const [activeTab, setActiveTab] = useState<"url" | "email" | "file" | "password">(() => {
    const state = location.state as { openTab?: string } | null;
    const tab = state?.openTab;
    if (tab === "url" || tab === "email" || tab === "file" || tab === "password") {
      return tab;
    }
    return "url";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("apgs-theme", theme);
  }, [theme]);

  useEffect(() => {
    const updateAuth = async () => {
      try {
        const { session } = await apiAuth.getSession();
        setIsAuthenticated(!!session?.user);
        if (session?.user) {
          setUserName(session.user.username || session.user.email || "");
        } else {
          setUserName("");
        }
      } catch (err) {
        setIsAuthenticated(false);
        setUserName("");
      }
    };
    updateAuth();
  }, []);

  const { data: historyData, refetch } = useQuery({
    queryKey: ['history'],
    queryFn: apiScans.getHistory,
    enabled: !!isAuthenticated,
  });

  const history = historyData?.history || [];

  const scrollHome = (anchor: string) => {
    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        const element = document.getElementById(anchor);
        if (element) element.scrollIntoView({ behavior: "smooth" });
      }, 200);
      return;
    }
    const element = document.getElementById(anchor);
    if (element) element.scrollIntoView({ behavior: "smooth" });
  };

  const handleLogout = async () => {
    await apiAuth.logout();
    setIsAuthenticated(false);
    setUserName("");
    navigate("/");
  };

  const refreshHistory = () => { refetch(); };

  return (
    <div className="min-h-screen cyber-grid text-foreground transition-colors duration-300" style={{ scrollBehavior: 'smooth' }}>
      <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur-lg transition-all duration-300">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity flex-shrink-0">
              <img 
                src="/apgs-logo.png" 
                alt="APGS Logo" 
                width="40" 
                height="40"
                className="h-10 w-10 object-contain flex-shrink-0 transition-all duration-300 hover:drop-shadow-lg" 
                style={{ filter: 'drop-shadow(0 0 6px rgba(0, 255, 156, 0.2))' }}
              />
              <div className="flex flex-col">
                <div className="text-lg md:text-xl font-heading font-bold text-primary">APGS</div>
                <div className="text-xs text-muted-foreground whitespace-nowrap">Advanced Phishing Guard System</div>
              </div>
            </a>
          </div>

          <nav className="flex items-center gap-2 text-sm flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{theme === "dark" ? "Dark" : "Light"}</span>
              <Switch checked={theme === "light"} onCheckedChange={(checked) => setTheme(checked ? "light" : "dark")} className="data-[state=checked]:bg-primary" />
            </div>
            <button onClick={() => scrollHome("home")} className="px-3 py-1 rounded-lg border border-border hover:bg-card/70 transition">Home</button>
            <button onClick={() => scrollHome("features")} className="px-3 py-1 rounded-lg border border-border hover:bg-card/70 transition">Features</button>
            <button onClick={() => scrollHome("contact")} className="px-3 py-1 rounded-lg border border-border hover:bg-card/70 transition">Contact</button>
            <button onClick={() => navigate("/scanning")} className="px-3 py-1 rounded-lg border border-primary text-primary bg-card/80">Scanning</button>
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 border border-border rounded-full px-3 py-1 bg-card/70 hover:bg-card/90 transition">
                  <User className="w-4 h-4 text-primary" />
                  <span className="hidden sm:inline">{userName || "Profile"}</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="bottom" align="end" className="bg-card border border-border text-foreground">
                  <DropdownMenuItem onSelect={() => navigate("/profile")} className="hover:bg-primary/10">Profile</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={handleLogout} className="hover:bg-destructive/10">Logout</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <button onClick={() => navigate("/login")} className="px-3 py-1 rounded-lg border border-border hover:bg-card/70 transition">Login</button>
                <button onClick={() => navigate("/login?view=signup")} className="px-3 py-1 rounded-lg border border-border hover:bg-card/70 transition">Sign Up</button>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10 space-y-8 transition-opacity duration-300">
        {/* Login CTA Section */}
        {!isAuthenticated && (
          <section className="bg-gradient-to-r from-primary/20 to-primary/10 rounded-xl border border-primary/40 p-6 shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between gap-4 flex-col sm:flex-row">
              <div>
                <h2 className="text-xl font-heading font-bold text-primary mb-1">Save Your Scan History</h2>
                <p className="text-muted-foreground text-sm">Sign in to automatically save all scan results and track security threats over time.</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button onClick={() => navigate("/login")} className="gap-2 hover:shadow-[0_0_16px_hsl(150_100%_45%/0.3)] transition-shadow">
                  <LogIn className="w-4 h-4" />
                  <span>Login</span>
                </Button>
                <Button onClick={() => navigate("/login?view=signup")} variant="outline" className="gap-2 border-border hover:bg-card/70 transition">
                  <span>Sign Up</span>
                </Button>
              </div>
            </div>
          </section>
        )}
        
        <section className="bg-card/70 rounded-xl border border-border p-6 shadow-lg">
          <h1 className="text-3xl font-heading font-bold mb-2">Scanning Hub</h1>
          <p className="text-muted-foreground">Access all scanning modules in one place. {isAuthenticated ? "Your scan history is automatically saved." : "Guest mode works without login. Sign in to save history and view results."}</p>
        </section>

        <section className="border border-border rounded-xl bg-card/70 p-4 transition-all duration-300">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: "url", label: "URL Scan", icon: Globe },
              { id: "email", label: "Email Check", icon: Mail },
              { id: "file", label: "File Analysis", icon: FileText },
              { id: "password", label: "Password Check", icon: Lock },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as "url" | "email" | "file" | "password")}
                className={`py-2 px-3 rounded-lg border transition-all duration-200 ${activeTab === tab.id ? "border-primary text-primary bg-primary/10 shadow-[0_0_8px_hsl(150_100%_45%_/_0.2)]" : "border-border text-muted-foreground hover:border-primary/70"}`}
              >
                <div className="flex items-center justify-center gap-2 text-sm font-medium">
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-4 transition-all duration-300">
          {activeTab === "url" && <UrlScanner onScanComplete={refreshHistory} isAuthenticated={!!isAuthenticated} userName={userName} scanData={urlScanData} setScanData={setUrlScanData} />}
          {activeTab === "email" && <EmailBreachChecker onScanComplete={refreshHistory} isAuthenticated={!!isAuthenticated} userName={userName} scanData={emailScanData} setScanData={setEmailScanData} />}
          {activeTab === "file" && <FileScanner onScanComplete={refreshHistory} isAuthenticated={!!isAuthenticated} userName={userName} scanData={fileScanData} setScanData={setFileScanData} />}
          {activeTab === "password" && <PasswordChecker onScanComplete={refreshHistory} isAuthenticated={!!isAuthenticated} userName={userName} scanData={passwordScanData} setScanData={setPasswordScanData} />}
        </section>

        {isAuthenticated ? (
          <ActivityHistory history={history} />
        ) : (
          <div className="rounded-xl border border-border p-4 bg-card/60 text-sm text-muted-foreground">Log in to save activity and review history. Guest scans are still available but are not stored.</div>
        )}
      </main>
    </div>
  );
};

export default Scanning;
