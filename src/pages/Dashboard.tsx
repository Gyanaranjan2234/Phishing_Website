import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, LogOut, User, Globe, FileText, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import { apiAuth, apiScans } from "@/lib/api-backend";  // FIXED: Use real backend, not mock
import StatsCards from "@/components/dashboard/StatsCards";
import UrlScanner from "@/components/dashboard/UrlScanner";
import FileScanner from "@/components/dashboard/FileScanner";
import EmailBreachChecker from "@/components/dashboard/EmailBreachChecker";
import PasswordChecker from "@/components/dashboard/PasswordChecker";
import ActivityHistory from "@/components/dashboard/ActivityHistory";

const Dashboard = () => {
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState<"url" | "file" | "search">("url");
  const [activeNav, setActiveNav] = useState<"home" | "features" | "how" | "contact" | "dashboard">("dashboard");
  const [userName, setUserName] = useState<string>("");
  const [userId, setUserId] = useState<number | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">(() => (localStorage.getItem("apgs-theme") === "light" ? "light" : "dark"));

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { session } = await apiAuth.getSession();
        if (!session || !session.user) {
          setUserId(null);
          navigate("/");
          return;
        }
        setUserName(session.user.username || session.user.email || "");
        setUserId(Number(session.user.id));
      } catch (err) {
        setUserId(null);
        navigate("/");
      }
    };
    checkAuth();
  }, [navigate]);

  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("apgs-theme", theme);
  }, [theme]);

  const handleLogout = async () => {
    await apiAuth.logout();
    // 4. Clear data on logout
    console.log("Logging out - clearing history and stats");
    navigate("/");
  };

  /* Removed API Stats call as per request
  const { data: statsData, refetch: refetchStats } = useQuery({
    queryKey: ['stats'],
    queryFn: apiScans.getStats,
  });
  */

  const { data: historyData, refetch: refetchHistory } = useQuery({
    queryKey: ['history', userId],
    queryFn: () => userId ? apiScans.getHistory(userId) : Promise.resolve({ history: [] }),
    enabled: !!userId,
  });

  // 2. Calculate Stats Dynamically: After fetching history
  const history = historyData?.history || [];
  
  const stats = {
    totalScans: history.length,
    // Safe: status is 'safe' or 'strong'
    safe: history.filter((item: any) => item.status === "safe" || item.status === "strong").length,
    // Threats: status is 'phishing', 'breached'
    threats: history.filter((item: any) => item.status === "phishing" || item.status === "breached").length,
  };

  // 6. Debugging
  console.log("history from API:", history);
  console.log("stats:", stats);

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
    // refetchStats(); // Removed
    refetchHistory();
  }, [refetchHistory]);

  const goToLandingSection = (anchor: "home" | "features" | "contact") => {
    navigate(`/#${anchor}`);
    setActiveNav(anchor);
  };

  return (
    <div className="min-h-screen cyber-grid">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-shrink-0">
            <img 
              src="/apgs-logo.png" 
              alt="APGS Logo" 
              width="40" 
              height="40"
              className="h-10 w-10 object-contain flex-shrink-0 transition-all duration-300 hover:drop-shadow-lg" 
              style={{ filter: 'drop-shadow(0 0 6px rgba(0, 255, 156, 0.2))' }}
            />
            <div className="flex flex-col">
              <div className="font-heading font-bold text-primary text-lg">APGS</div>
              <div className="hidden sm:block text-muted-foreground text-xs font-mono whitespace-nowrap">Advanced Phishing Guard System</div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => goToLandingSection("home")} className={`px-3 py-1 rounded-lg border ${activeNav === "home" ? "border-primary text-primary" : "border-border"}`}>
              Home
            </button>
            <button onClick={() => goToLandingSection("features")} className={`px-3 py-1 rounded-lg border ${activeNav === "features" ? "border-primary text-primary" : "border-border"}`}>
              Features
            </button>
            <button onClick={() => goToLandingSection("contact")} className={`px-3 py-1 rounded-lg border ${activeNav === "contact" ? "border-primary text-primary" : "border-border"}`}>
              Contact
            </button>
            <button onClick={() => navigate("/scanning")} className="px-3 py-1 rounded-lg border border-border hover:bg-card/70 transition">
              Scanning
            </button>
            <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg border border-border/30 bg-card/40 transition-all duration-200">
              <span className="text-xs text-muted-foreground font-medium">{theme === "dark" ? "Dark" : "Light"}</span>
              <Switch checked={theme === "light"} onCheckedChange={(checked) => setTheme(checked ? "light" : "dark")} className="" />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card/80 hover:bg-card/90 transition">
                <User className="w-4 h-4 text-primary" />
                <span className="hidden sm:inline">{userName || "Profile"}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="bottom" align="end" className="bg-card border-border ring-primary">
                <DropdownMenuItem onSelect={() => navigate("/profile")}>Profile</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={handleLogout}>Sign Out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="animate-fade-in-up">
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground">Security Dashboard</h1>
          <p className="text-muted-foreground mt-1">Monitor threats, analyze URLs, and check for breaches</p>
        </div>

        <StatsCards totalScans={stats.totalScans} threats={stats.threats} safe={stats.safe} />

        <div className="border border-border rounded-lg overflow-hidden bg-card/40 backdrop-blur-sm">
          <div className="grid grid-cols-3 text-center text-xs sm:text-sm font-semibold uppercase">
            <button
              onClick={() => setActiveTab("url")}
              className={`px-4 py-3 transition relative ${activeTab === "url" ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"}`}
            >
              <div className="inline-flex items-center justify-center gap-2">
                <Globe className="w-4 h-4" />
                URL
              </div>
              <span className={`absolute left-0 right-0 bottom-0 h-0.5 transition-all duration-300 ${activeTab === "url" ? "bg-primary" : "bg-transparent"}`} />
            </button>
            <button
              onClick={() => setActiveTab("file")}
              className={`px-4 py-3 transition relative ${activeTab === "file" ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"}`}
            >
              <div className="inline-flex items-center justify-center gap-2">
                <FileText className="w-4 h-4" />
                File
              </div>
              <span className={`absolute left-0 right-0 bottom-0 h-0.5 transition-all duration-300 ${activeTab === "file" ? "bg-primary" : "bg-transparent"}`} />
            </button>
            <button
              onClick={() => setActiveTab("search")}
              className={`px-4 py-3 transition relative ${activeTab === "search" ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"}`}
            >
              <div className="inline-flex items-center justify-center gap-2">
                <Search className="w-4 h-4" />
                Search
              </div>
              <span className={`absolute left-0 right-0 bottom-0 h-0.5 transition-all duration-300 ${activeTab === "search" ? "bg-primary" : "bg-transparent"}`} />
            </button>
          </div>
        </div>

        {activeTab === "url" && (
          <div className="pt-4">
            <UrlScanner onScanComplete={refresh} isAuthenticated={true} />
          </div>
        )}

        {activeTab === "file" && (
          <div className="pt-4">
            <FileScanner onScanComplete={refresh} />
          </div>
        )}

        {activeTab === "search" && (
          <div className="grid lg:grid-cols-2 gap-6 pt-4">
            <EmailBreachChecker onScanComplete={refresh} />
            <PasswordChecker onScanComplete={refresh} />
          </div>
        )}

        <ActivityHistory history={history} />
      </main>
    </div>
  );
};

export default Dashboard;
