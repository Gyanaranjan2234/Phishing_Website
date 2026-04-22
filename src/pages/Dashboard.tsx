import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, LogOut, User, Globe, FileText, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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
          // navigate("/"); // 3. Removed auto-redirect as per request
          return;
        }
        setUserName(session.user.username || session.user.email || "");
        setUserId(Number(session.user.id));
      } catch (err) {
        setUserId(null);
        // navigate("/"); // 3. Removed auto-redirect as per request
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

  // Fetch real-time stats from backend
  const { data: statsResponse, refetch: refetchStats, isLoading: statsLoading } = useQuery({
    queryKey: ['stats', userId],
    queryFn: async () => {
      if (!userId) return { data: { totalScans: 0, safeScans: 0, threatScans: 0 } };
      console.log(`📡 Dashboard: Fetching real-time stats for user ${userId}...`);
      const res = await apiScans.getStats(userId);
      console.log("📊 Dashboard: Stats API response received:", res.data);
      return res;
    },
    enabled: !!userId,
    staleTime: 0, // Ensure we always get fresh data
    gcTime: 0,
  });

  const stats = statsResponse?.data || { totalScans: 0, safeScans: 0, threatScans: 0 };


  const { data: history, refetch: refetchHistory } = useQuery({
    queryKey: ['history', userId],
    queryFn: async () => {
      if (!userId) return [];
      const res = await apiScans.getHistory(userId, 1000);
      
      const rawData = res.data || [];
      // 2. Transform raw backend data to frontend ScanHistoryItem format
      const transformed = rawData.map((scan: any) => ({
        id: scan.id.toString(),
        type: (scan.scan_type || "url") as "url" | "file" | "email" | "password",
        target: scan.target || "",
        status: (scan.status || "safe") as "safe" | "phishing" | "breached" | "weak" | "medium" | "strong",
        timestamp: scan.timestamp ? new Date(scan.timestamp) : new Date()
      }));
      
      console.log("Transformed history for Dashboard:", transformed);
      return transformed;
    },
    enabled: !!userId,
    staleTime: 0,
  });

  // 6. Debugging
  console.log("history from API:", history);
  console.log("stats from API:", stats);

  const queryClient = useQueryClient();
  const refresh = useCallback(async () => {
    console.log("🔄 Dashboard: Refreshing history and stats after clear...");
    
    try {
      // 1. Instant UI update: Clear caches immediately
      queryClient.setQueryData(['history', userId], []);
      queryClient.setQueryData(['stats', userId], { data: { totalScans: 0, safeScans: 0, threatScans: 0 } });
      
      // 2. Invalidate queries to force fresh fetch from backend
      await queryClient.invalidateQueries({ queryKey: ['history', userId] });
      await queryClient.invalidateQueries({ queryKey: ['stats', userId] });
      
      // 3. Perform manual refetch to ensure data is reloaded
      await Promise.all([
        refetchStats(),
        refetchHistory()
      ]);
      
      console.log("✅ Dashboard: History and stats refreshed successfully");
      
    } catch (err) {
      console.error("Refresh error:", err);
      // Only reload on error as fallback
      window.location.reload(); 
    }
  }, [refetchHistory, refetchStats, queryClient, userId]);

  const goToLandingSection = (anchor: "home" | "features" | "contact") => {
    navigate(`/#${anchor}`);
    setActiveNav(anchor);
  };

  return (
    <div className="min-h-screen cyber-grid !overflow-visible">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-[100] !overflow-visible">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3 !overflow-visible">
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
              <DropdownMenuContent 
                side="bottom" 
                align="end" 
                className="bg-slate-900 text-green-400 border border-green-400/50 z-[9999] min-w-[180px] shadow-[0_0_20px_rgba(0,255,156,0.2)] p-1.5 animate-in fade-in zoom-in-95"
                sideOffset={10}
              >
                <DropdownMenuItem 
                  onSelect={() => navigate("/profile")}
                  className="hover:bg-slate-800 focus:bg-slate-800 focus:text-green-300 cursor-pointer rounded-md transition-colors"
                >
                  <User className="w-4 h-4 mr-2" />
                  View Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-green-400/20 my-1" />
                <DropdownMenuItem 
                  onSelect={handleLogout}
                  className="hover:bg-red-500/10 focus:bg-red-500/10 text-red-400 focus:text-red-300 cursor-pointer rounded-md transition-colors"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* 2. Conditional Rendering: Only show the FULL Scanning Hub if userId exists */}
        {userId && (
          <>
            <div className="animate-fade-in-up">
              <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground">Security Dashboard</h1>
              <p className="text-muted-foreground mt-1">Monitor threats, analyze URLs, and check for breaches</p>
            </div>

            <StatsCards 
              totalScans={stats.totalScans || 0} 
              threats={stats.threatScans || 0} 
              safe={stats.safeScans || 0} 
            />

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
          </>
        )}


        <ActivityHistory 
          key={`history-list-${history?.length || 0}-${userId || 'none'}`}
          history={history || []} 
          onHistoryChange={refresh}
          userId={userId}
        />
      </main>
    </div>
  );
};

export default Dashboard;
