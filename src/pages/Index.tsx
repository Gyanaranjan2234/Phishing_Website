import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Globe, FileText, Mail, Lock, ShieldCheck, Zap, Phone, Loader2, User, ChevronDown, ArrowUp, LogIn, Link, Shield, AlertTriangle, FileCheck, Eye, BookOpen, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { apiAuth, apiScans, apiContacts, getPlatformStats } from "@/lib/api-backend";  // FIXED: Using real backend
import { getGuestScanCount, canGuestScan } from "@/lib/guestAccess";
import { useScrollActiveSection } from "@/hooks/use-scroll-active-section";
import UrlScanner from "@/components/dashboard/UrlScanner";
import EmailBreachChecker from "@/components/dashboard/EmailBreachChecker";
import FileScanner from "@/components/dashboard/FileScanner";
import PasswordChecker from "@/components/dashboard/PasswordChecker";
import ActivityHistory from "@/components/dashboard/ActivityHistory";
import SecurityQuizComponent from "@/components/dashboard/SecurityQuiz";

/**
 * FaqItem Component
 * No memo needed - simple enough that re-render cost is minimal
 */
const FaqItem = ({ question, answer }: { question: string; answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-xl border border-border bg-card/75 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-card/90 transition-colors"
      >
        <span className="font-medium text-foreground">{question}</span>
        <ChevronDown className={`w-5 h-5 text-primary transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="px-4 pb-4 text-muted-foreground text-sm leading-relaxed">
          {answer}
        </div>
      )}
    </div>
  );
};

/**
 * Main Index Component - Consolidated Layout
 * 
 * STRICT CONTROL PRINCIPLES:
 * 1. All content sections rendered once at mount in a hidden state
 * 2. Visibility toggled via CSS (opacity + transform), never mount/unmount
 * 3. Scan state preserved across view switches - NEVER reset unless user clicks Reset button
 * 4. Navbar structure ALWAYS the same - no dynamic add/remove of items
 * 5. UseRef to track manually overridden state to prevent re-renders
 */
const Index = () => {
  const navigate = useNavigate();
  const mountTimeRef = useRef<number>(Date.now());

  // ============= SCROLL RESTORATION SETUP =============
  // Disable browser's automatic scroll restoration to take full control
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  // ============= THEME & AUTHENTICATION =============
  const [theme, setTheme] = useState<"dark" | "light">(() => (localStorage.getItem("apgs-theme") === "light" ? "light" : "dark"));
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [userName, setUserName] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    const storedUserId = localStorage.getItem("user_id");
    if (storedUserId) {
      setUserId(Number(storedUserId));
    }
  }, []);
  const [guestScanCount, setGuestScanCount] = useState<number>(() => {
    try {
      return getGuestScanCount();
    } catch {
      return 0;
    }
  });

  // ============= VIEW MANAGEMENT =============
  // Single source of truth for current view - NO ROUTING
  // "home" | "scanning" | "prevention" | "quiz" - determines which section is visible via CSS
  // Initialize from localStorage if available, otherwise default to "home"
  const [currentView, setCurrentView] = useState<"home" | "scanning" | "prevention" | "quiz">(() => {
    try {
      const savedView = localStorage.getItem("apgs-lastView");
      return (savedView === "scanning" || savedView === "home" || savedView === "prevention" || savedView === "quiz") ? savedView : "home";
    } catch {
      return "home";
    }
  });
  const [scanActiveTab, setScanActiveTab] = useState<"url" | "email" | "file" | "password">("url");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ============= HOME PAGE STATE =============
  const [stats, setStats] = useState({ totalScans: 0, threats: 0, safe: 0, activeUsers: 0, suspicious: 0 });
  const [featureLoading, setFeatureLoading] = useState<string | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [contact, setContact] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);
  
  // ============= STATS ANIMATION STATE =============
  const [platformStats, setPlatformStats] = useState({ totalUsers: 0, totalScans: 0 });
  const [displayedScans24h, setDisplayedScans24h] = useState(0);
  const [displayedActiveUsers, setDisplayedActiveUsers] = useState(0);

  // Fetch real global platform stats from backend
  useEffect(() => {
    const fetchStats = async () => {
      const data = await getPlatformStats();
      if (data) {
        setPlatformStats({
          totalUsers: data.total_users || 0,
          totalScans: data.total_scans || 0
        });
      }
    };
    fetchStats();
  }, []);

  // ============= SCAN STATE - PRESERVED ACROSS TAB SWITCHES =============
  const [urlScanData, setUrlScanData] = useState({ input: "", result: null as any });
  const [emailScanData, setEmailScanData] = useState({ input: "", result: null as any });
  const [fileScanData, setFileScanData] = useState({ file: null as File | null, result: null as any });
  const [passwordScanData, setPasswordScanData] = useState({ input: "", result: null as any });

  // ============= SCROLL-BASED ACTIVE SECTION (HOME PAGE ONLY) =============
  const { activeSection, setActiveSection } = useScrollActiveSection({
    sectionIds: ["home", "contact"],
    rootMargin: "-35% 0px -65% 0px",
    threshold: [0.1, 0.5],
  });

  // ============= HISTORY DATA =============
  const { data: historyList, refetch: refetchHistory } = useQuery({
    queryKey: ['history', userId],
    queryFn: async () => {
      if (!userId) return [];
      const res = await apiScans.getHistory(userId);
      
      const rawData = res.data || [];
      // Transform raw backend data to frontend ScanHistoryItem format
      const transformed = rawData.map((scan: any) => ({
        id: scan.id.toString(),
        type: (scan.scan_type || "url") as "url" | "file" | "email" | "password",
        target: scan.target || "",
        status: (scan.status || "safe") as "safe" | "phishing" | "breached" | "weak" | "medium" | "strong",
        timestamp: scan.timestamp ? new Date(scan.timestamp) : new Date()
      }));
      
      console.log("[Index] Transformed history:", transformed);
      return transformed;
    },
    enabled: !!isAuthenticated && !!userId,
  });

  // Removed API Stats call as per request to calculate dynamically from history
  /*
  const { data: statsData, refetch: refetchStats } = useQuery({
    queryKey: ['stats'],
    queryFn: apiScans.getStats,
  });
  */

  // ============= EFFECTS: SAVE CURRENT VIEW TO LOCALSTORAGE =============
  // Whenever currentView changes, save it to localStorage for persistence on refresh
  useEffect(() => {
    try {
      localStorage.setItem("apgs-lastView", currentView);
    } catch (err) {
      console.warn("[ScrollRestore] Failed to save view to localStorage:", err);
    }
  }, [currentView]);

  // ============= EFFECTS: SCROLL TO SCANNING ON MOUNT IF NEEDED =============
  // On initial mount, if currentView is "scanning", scroll to top of scanning section
  useEffect(() => {
    // Only run once on mount - check if we restored from localStorage
    const timeSinceMountMs = Date.now() - mountTimeRef.current;
    
    // If this effect runs very soon after mount (< 100ms) and view is scanning, scroll to top
    if (timeSinceMountMs < 100 && currentView === "scanning") {
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: "auto" });
      });
    }
  }, []); // Empty dependency - runs once on mount

  // ============= EFFECTS: THEME =============
  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("apgs-theme", theme);
  }, [theme]);

  // ============= EFFECTS: AUTHENTICATION =============
  useEffect(() => {
    const getSession = async () => {
      try {
        const { session } = await apiAuth.getSession();
        setIsAuthenticated(!!session?.user);
        if (session?.user) {
          setUserName(session.user.username || session.user.email || "");
          setUserEmail(session.user.email || "");
          setUserId(Number(session.user.id));
        } else {
          setUserName("");
          setUserEmail("");
          setUserId(null);
        }
      } catch (err) {
        console.error("[Auth Error]", err);
        setIsAuthenticated(false);
        setUserName("");
        setUserId(null);
      } finally {
        setAuthLoading(false);
      }
    };
    getSession();
  }, []);

  // 2. Calculate Stats Dynamically: After fetching history
  useEffect(() => {
    if (!historyList) return;
    
    console.log("history:", historyList); // 8. Debugging
    
    // Dynamic calculation mapping status fields
    const safe = historyList.filter((item: any) => item.status === "safe" || item.status === "strong").length;
    const threats = historyList.filter((item: any) => item.status === "phishing" || item.status === "breached").length;
    const suspicious = historyList.filter((item: any) => item.status === "weak" || item.status === "medium").length;
    const total = historyList.length;

    // 4. Update State
    setStats(prev => ({
      ...prev,
      safe,
      threats,
      totalScans: total,
      // activeUsers is not part of history, keeping as is or mock
    }));

    console.log("stats:", { safe, suspicious, threats, total }); // 8. Debugging
  }, [historyList]);

  // ============= EFFECTS: COUNT-UP ANIMATION FOR STATS SECTION =============
  useEffect(() => {
    if (platformStats.totalUsers === 0 && platformStats.totalScans === 0) return;

    let scansRaf = 0, usersRaf = 0;
    const start = Date.now();
    const duration = 1500;
    
    const animateScans = () => {
      const progress = Math.min(1, (Date.now() - start) / duration);
      setDisplayedScans24h(Math.floor(progress * platformStats.totalScans));
      if (progress < 1) scansRaf = requestAnimationFrame(animateScans);
    };
    
    const animateUsers = () => {
      const progress = Math.min(1, (Date.now() - start) / duration);
      setDisplayedActiveUsers(Math.floor(progress * platformStats.totalUsers));
      if (progress < 1) usersRaf = requestAnimationFrame(animateUsers);
    };
    
    scansRaf = requestAnimationFrame(animateScans);
    usersRaf = requestAnimationFrame(animateUsers);
    
    return () => {
      cancelAnimationFrame(scansRaf);
      cancelAnimationFrame(usersRaf);
    };
  }, [currentView, platformStats]);

  // ============= EFFECTS: BACK TO TOP =============
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ============= EFFECTS: RESET NAVBAR GLITCH WHEN RETURNING FROM PROFILE =============
  // When component mounts (user navigates back from Profile), reset activeSection to "home"
  useEffect(() => {
    setActiveSection("home");
  }, [setActiveSection]);

  // ============= HANDLERS =============
  // const refreshStats = () => refetchStats(); // Removed as stats are now dynamic
  const refreshHistory = () => {
    refetchHistory();
    setGuestScanCount(getGuestScanCount());
    // refetchStats(); // Removed
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!contact.name || !contact.email || !contact.message) {
      toast.error("Please fill in all fields");
      return;
    }

    setContactLoading(true);
    try {
      const response = await apiContacts.sendMessage(contact);
      
      if (response.status === "success") {
        setSent(true);
        toast.success(response.message || "Thanks! Your message has been received.");
        setContact({ name: "", email: "", message: "" });
        setTimeout(() => setSent(false), 3000);
      } else {
        toast.error(response.message || "Failed to send message. Please try again.");
      }
    } catch (error) {
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setContactLoading(false);
    }
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      setActiveSection(sectionId);
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const navTo = (anchor: string) => {
    // Always switch to home view, then scroll
    setCurrentView("home"); // This will trigger localStorage save via useEffect
    setTimeout(() => {
      scrollToSection(anchor);
    }, 100);
  };

  const switchToScanning = (tabName?: "url" | "email" | "file" | "password") => {
    // Switch to scanning view with optional tab
    if (tabName) {
      setScanActiveTab(tabName);
      console.log("[DEBUG] Switching to scanning with tab:", tabName);
    }
    setCurrentView("scanning"); // This will trigger localStorage save via useEffect
    console.log("[DEBUG] Set currentView to scanning");
    // Scroll to top of scanning section
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
      console.log("[DEBUG] Scrolled to top, currentView is now:", "scanning");
    }, 100);
  };

  const switchToPrevention = () => {
    // Switch to prevention view
    setCurrentView("prevention"); // This will trigger localStorage save via useEffect
    console.log("[DEBUG] Set currentView to prevention");
    // Scroll to top
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
      console.log("[DEBUG] Scrolled to top, currentView is now:", "prevention");
    }, 100);
  };

  const switchToQuiz = () => {
    // Switch to quiz view
    setCurrentView("quiz"); // This will trigger localStorage save via useEffect
    console.log("[DEBUG] Set currentView to quiz");
    // Scroll to top
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
      console.log("[DEBUG] Scrolled to top, currentView is now:", "quiz");
    }, 100);
  };

  const handleFeatureCardClick = (sectionId: string) => {
    setFeatureLoading(sectionId);
    const tabMap: Record<string, "url" | "email" | "file" | "password"> = {
      "url-scan": "url",
      "email-scan": "email",
      "file-scan": "file",
      "password-scan": "password",
    };
    const tab = tabMap[sectionId] || "url";
    setTimeout(() => {
      setFeatureLoading(null);
      switchToScanning(tab);
    }, 350);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const logout = async () => {
    await apiAuth.logout();
    setIsAuthenticated(false);
    setUserName("");
    setUserId(null);
    // 6. Reset on Logout - prevent fake display
    setStats({ safe: 0, suspicious: 0, threats: 0, totalScans: 0, activeUsers: 0 });
    navTo("home");
  };

  // ============= COMPUTED VALUES =============
  // Determine navbar active state based on current view
  const navActiveSection = currentView === "scanning" ? "scanning" : currentView === "prevention" ? "prevention" : (activeSection || "home");

  console.log("[DEBUG] Index Render State:", { currentView, navActiveSection, isAuthenticated });

  const featureCards = useMemo(
    () => [
      { icon: Globe, title: "URL Scanner", text: "Detect phishing and malicious links instantly.", sectionId: "url-scan" },
      { icon: Mail, title: "Email Checker", text: "Validate email safety and breach status.", sectionId: "email-scan" },
      { icon: FileText, title: "File Analysis", text: "Scan uploads for hidden malware signatures.", sectionId: "file-scan" },
      { icon: Lock, title: "Password Checker", text: "Check password strength and detect possible data leaks.", sectionId: "password-scan" },
    ],
    []
  );

  // const historyList = historyData?.history || []; // Moved up to fix ReferenceError

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* ========== MAIN CONTENT WRAPPER ========== */}
      <div className="cyber-grid text-foreground flex-1 section-animate">
        {/* ========== NAVBAR: ALWAYS VISIBLE, STRUCTURE CONSTANT ========== */}
        <header className="sticky top-0 z-50 border-b border-border/50 bg-card/80 backdrop-blur-xl transition-all duration-200 shadow-lg relative">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-3">
          {/* LOGO - Always left */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
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
                <div className="text-xs text-muted-foreground whitespace-nowrap hidden sm:block">Advanced Phishing Guard System</div>
              </div>
            </a>
          </div>

          {/* RIGHT SIDE - Toggle + Profile + Hamburger */}
          <div className="flex items-center gap-2">
            {/* DESKTOP NAV - Hidden on mobile (≤768px) */}
            <nav className="hidden md:flex items-center gap-2 text-sm flex-nowrap">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="relative w-10 h-10 rounded-lg border border-border/50 bg-card/50 
                           hover:border-primary/50 hover:bg-primary/10 
                           transition-all duration-300 hover:scale-105 
                           hover:shadow-[0_0_12px_hsl(150_100%_45%_/_0.3)]
                           flex items-center justify-center group"
                aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              >
                {/* Sun Icon - Shows in light mode */}
                <span 
                  className={`absolute transition-all duration-300 ${
                    theme === "light" 
                      ? "opacity-100 scale-100 rotate-0" 
                      : "opacity-0 scale-50 rotate-90"
                  }`}
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="text-amber-500 group-hover:text-primary"
                  >
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" />
                    <line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                  </svg>
                </span>
                
                {/* Moon Icon - Shows in dark mode */}
                <span 
                  className={`absolute transition-all duration-300 ${
                    theme === "dark" 
                      ? "opacity-100 scale-100 rotate-0" 
                      : "opacity-0 scale-50 -rotate-90"
                  }`}
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="text-blue-400 group-hover:text-primary"
                  >
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                </span>
              </button>
            </div>

            <button
              onClick={() => navTo("home")}
              className={`px-3 py-1 rounded-lg border transition-all duration-300 ${
                navActiveSection === "home"
                  ? "border-primary text-primary shadow-[0_0_12px_hsl(150_100%_45%_/_0.4)]"
                  : "border-border text-foreground hover:border-primary/50 hover:bg-primary/5 hover:text-primary hover:shadow-[0_0_12px_hsl(150_100%_45%_/_0.2)]"
              }`}
            >
              Home
            </button>

            <button
              onClick={() => navTo("contact")}
              className={`px-3 py-1 rounded-lg border transition-all duration-300 ${
                navActiveSection === "contact"
                  ? "border-primary text-primary shadow-[0_0_12px_hsl(150_100%_45%_/_0.4)]"
                  : "border-border text-foreground hover:border-primary/50 hover:bg-primary/5 hover:text-primary hover:shadow-[0_0_12px_hsl(150_100%_45%_/_0.2)]"
              }`}
            >
              Contact
            </button>

            <button
              onClick={() => switchToScanning()}
              className={`px-3 py-1 rounded-lg border transition-all duration-300 ${
                navActiveSection === "scanning"
                  ? "border-primary text-primary shadow-[0_0_12px_hsl(150_100%_45%_/_0.4)]"
                  : "border-border text-foreground hover:border-primary/50 hover:bg-primary/5 hover:text-primary hover:shadow-[0_0_12px_hsl(150_100%_45%_/_0.2)]"
              }`}
            >
              Scanning
            </button>

            <button
              onClick={() => switchToPrevention()}
              className={`px-3 py-1 rounded-lg border transition-all duration-300 ${
                navActiveSection === "prevention"
                  ? "border-primary text-primary shadow-[0_0_12px_hsl(150_100%_45%_/_0.4)]"
                  : "border-border text-foreground hover:border-primary/50 hover:bg-primary/5 hover:text-primary hover:shadow-[0_0_12px_hsl(150_100%_45%_/_0.2)]"
              }`}
            >
              Prevention
            </button>

            {!authLoading && isAuthenticated && (
              <button
                onClick={() => switchToQuiz()}
                className={`px-3 py-1 rounded-lg border transition-all duration-300 ${
                  navActiveSection === "quiz"
                    ? "border-primary text-primary shadow-[0_0_12px_hsl(150_100%_45%_/_0.4)]"
                    : "border-border text-foreground hover:border-primary/50 hover:bg-primary/5 hover:text-primary hover:shadow-[0_0_12px_hsl(150_100%_45%_/_0.2)]"
                }`}
              >
                Security Quiz
              </button>
            )}

            {!authLoading && isAuthenticated && (
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 border border-border/50 rounded-full px-2 py-1.5 bg-gradient-to-r from-primary/10 to-cyan-500/10 hover:from-primary/20 hover:to-cyan-500/20 transition-all duration-300 hover:border-primary/30 hover:shadow-[0_0_12px_hsl(150_100%_45%_/_0.2)]">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center text-primary-foreground font-semibold text-sm">
                    {(userName || "U").charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline text-sm font-medium">{userName || "Profile"}</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="bottom" align="end" className="bg-card border border-border text-foreground shadow-xl">
                  <DropdownMenuItem onSelect={() => navigate("/profile")} className="hover:bg-primary/10">
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={logout} className="hover:bg-destructive/10">
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {!authLoading && !isAuthenticated && (
              <>
                <button
                  onClick={() => navigate("/login")}
                  className="px-4 py-1.5 rounded-lg border border-primary/50 text-primary hover:bg-primary/20 hover:border-primary transition-all duration-300 font-medium text-sm hover:shadow-[0_0_12px_hsl(150_100%_45%_/_0.3)]"
                >
                  Login
                </button>
                <button
                  onClick={() => navigate("/login?view=signup")}
                  className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-primary to-cyan-500 text-primary-foreground hover:shadow-[0_0_16px_hsl(150_100%_45%_/_0.4)] transition-all duration-300 font-semibold text-sm hover:scale-105"
                >
                  Sign Up
                </button>
              </>
            )}
            </nav>

            {/* MOBILE HAMBURGER BUTTON - Visible only on mobile (≤768px) */}
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
            className="md:hidden absolute top-full left-0 w-full bg-[#0b0f1a] border-t border-border/50 shadow-2xl z-[1000] animate-in slide-in-from-top-2 duration-200"
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              width: '100%',
              zIndex: 1000
            }}
          >
            {/* USER PROFILE SECTION - Only show when authenticated */}
            {!authLoading && isAuthenticated && (
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
                      onClick={() => { logout(); setMobileMenuOpen(false); }}
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
                onClick={() => { navTo("home"); setMobileMenuOpen(false); }}
                className={`w-full text-left px-4 py-3 rounded-lg border transition-all duration-200 min-h-[44px] ${
                  navActiveSection === "home"
                    ? "border-primary text-primary bg-primary/10"
                    : "border-border text-foreground hover:border-primary/50 hover:bg-primary/5"
                }`}
              >
                Home
              </button>
              <button
                onClick={() => { navTo("contact"); setMobileMenuOpen(false); }}
                className={`w-full text-left px-4 py-3 rounded-lg border transition-all duration-200 min-h-[44px] ${
                  navActiveSection === "contact"
                    ? "border-primary text-primary bg-primary/10"
                    : "border-border text-foreground hover:border-primary/50 hover:bg-primary/5"
                }`}
              >
                Contact
              </button>
              <button
                onClick={() => { switchToScanning(); setMobileMenuOpen(false); }}
                className={`w-full text-left px-4 py-3 rounded-lg border transition-all duration-200 min-h-[44px] ${
                  navActiveSection === "scanning"
                    ? "border-primary text-primary bg-primary/10"
                    : "border-border text-foreground hover:border-primary/50 hover:bg-primary/5"
                }`}
              >
                Scanning
              </button>
              <button
                onClick={() => { switchToPrevention(); setMobileMenuOpen(false); }}
                className={`w-full text-left px-4 py-3 rounded-lg border transition-all duration-200 min-h-[44px] ${
                  navActiveSection === "prevention"
                    ? "border-primary text-primary bg-primary/10"
                    : "border-border text-foreground hover:border-primary/50 hover:bg-primary/5"
                }`}
              >
                Prevention
              </button>
              {!authLoading && isAuthenticated && (
                <button
                  onClick={() => { switchToQuiz(); setMobileMenuOpen(false); }}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-all duration-200 min-h-[44px] ${
                    navActiveSection === "quiz"
                      ? "border-primary text-primary bg-primary/10"
                      : "border-border text-foreground hover:border-primary/50 hover:bg-primary/5"
                  }`}
                >
                  Security Quiz
                </button>
              )}
              {!authLoading && !isAuthenticated && (
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => { navigate("/login"); setMobileMenuOpen(false); }}
                    className="flex-1 px-4 py-3 rounded-lg border border-primary/50 text-primary hover:bg-primary/20 transition-all duration-200 font-medium min-h-[44px]"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => { navigate("/login?view=signup"); setMobileMenuOpen(false); }}
                    className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-primary to-cyan-500 text-primary-foreground transition-all duration-200 font-semibold min-h-[44px]"
                  >
                    Sign Up
                  </button>
                </div>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* ========== MAIN CONTENT: USE CSS TO TOGGLE VISIBILITY ========== */}
      {/* All sections rendered once, visibility controlled by CSS opacity + transform */}

      {/* ========== HOME VIEW SECTION ========== */}
      <div
        className={`transition-all duration-300 ${
          currentView === "home" ? "block opacity-100" : "hidden opacity-0"
        }`}
      >
        {currentView === "home" && console.log("[DEBUG] Rendering home view")}
        <main id="home" className="max-w-6xl mx-auto px-4 py-10 space-y-16 scroll-mt-[120px]">
          {/* Hero Section */}
          <div className="w-full text-center mb-8 px-4">
              <h1
  className="font-heading font-bold bg-gradient-to-r from-[#00ff88] via-[#00d4ff] to-[#3b82f6] bg-clip-text text-transparent drop-shadow-lg mx-auto"
  style={{
    backgroundImage: 'linear-gradient(90deg, #00ff88, #00d4ff, #3b82f6)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    filter: 'drop-shadow(0 0 10px rgba(0, 255, 136, 0.2))',
    lineHeight: '1.2',
    letterSpacing: '-0.02em',
    textAlign: 'center',
    fontSize: 'clamp(1.5rem, 6vw, 3.5rem)',
    fontWeight: 700,
    wordBreak: 'break-word',
    overflowWrap: 'break-word',
    margin: '0 auto',
    maxWidth: '100%'
  }}
>
  Advanced Phishing Guard System
</h1>
          </div>

          <section className="grid gap-8 lg:grid-cols-2 items-center transition-all duration-300">
                          
            <div className=" space-y-6">
              <p className="text-muted-foreground text-base sm:text-lg">
                Advanced Phishing Guard System is a powerful cybersecurity platform designed to detect phishing threats, analyze suspicious URLs, scan files, and check password security. It provides real-time protection and detailed insights to help users stay safe in the digital world.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => switchToScanning()} className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg transition-all duration-300 ease-in-out hover:scale-105 active:scale-98 hover:shadow-[0_0_20px_hsl(150_100%_45%_/_0.4)] hover:drop-shadow-[0_0_8px_hsl(150_100%_45%_/_0.3)] cursor-pointer">
                  Start Scanning
                </Button>
                {!authLoading && !isAuthenticated && (
                  <Button onClick={() => navigate("/login")} variant="outline" className="px-6 py-2.5 border-primary text-primary hover:bg-primary/20 hover:text-primary hover:border-primary font-semibold rounded-lg transition-all duration-300 ease-in-out hover:scale-105 active:scale-98 hover:shadow-[0_0_20px_hsl(150_100%_45%_/_0.3)] cursor-pointer">
                    Login
                  </Button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-card/70 p-4 border border-border hover:border-primary/50 shadow-[0_0_12px_hsl(150_100%_45%_/_0.15)] hover:shadow-[0_0_16px_hsl(150_100%_45%_/_0.25)] transition-all duration-300 hover:scale-105 cursor-default">
                Secure Live URL Checks
              </div>
              <div className="rounded-xl bg-card/70 p-4 border border-border hover:border-primary/50 shadow-[0_0_12px_hsl(150_100%_45%_/_0.15)] hover:shadow-[0_0_16px_hsl(150_100%_45%_/_0.25)] transition-all duration-300 hover:scale-105 cursor-default">
                Email Breach Discovery
              </div>
              <div className="rounded-xl bg-card/70 p-4 border border-border hover:border-primary/50 shadow-[0_0_12px_hsl(150_100%_45%_/_0.15)] hover:shadow-[0_0_16px_hsl(150_100%_45%_/_0.25)] transition-all duration-300 hover:scale-105 cursor-default">
                File Malware Analysis
              </div>
              <div className="rounded-xl bg-card/70 p-4 border border-border hover:border-primary/50 shadow-[0_0_12px_hsl(150_100%_45%_/_0.15)] hover:shadow-[0_0_16px_hsl(150_100%_45%_/_0.25)] transition-all duration-300 hover:scale-105 cursor-default">
                Password Leak Checker
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section id="features" className="space-y-6 scroll-mt-[120px] transition-all duration-300">
            <div className="space-y-6">
              <h2 className="text-2xl font-heading font-bold">Features</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {featureCards.map((card, i) => {
                  const Icon = card.icon;
                  const loading = featureLoading === card.sectionId;
                  return (
                    <article
                      key={`feature-${card.sectionId}`}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleFeatureCardClick(card.sectionId)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          handleFeatureCardClick(card.sectionId);
                        }
                      }}
                      className={`rounded-xl border p-4 bg-card/75 cursor-pointer transition-all duration-200 ${
                        activeSection === card.sectionId
                          ? "border-primary shadow-[0_0_18px_hsl(150_100%_45%_/_0.35)] scale-105"
                          : "border-border hover:shadow-[0_0_18px_hsl(150_100%_45%_/_0.2)] hover:scale-105"
                      }`}
                    >
                      <div className="flex items-center gap-2 text-primary mb-2">
                        <Icon className="w-5 h-5" />
                        <h3 className="text-sm font-semibold">{card.title}</h3>
                        {loading && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                      </div>
                      <p className="text-sm text-muted-foreground">{card.text}</p>
                    </article>
                  );
                })}
              </div>
            </div>
          </section>

          {/* About Section */}
          <section id="about" className="space-y-10 scroll-mt-[120px] transition-all duration-300">
            <div className="space-y-6">
              <h2 className="text-2xl font-heading font-bold">About APGS</h2>
              <div className="grid lg:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <p className="text-muted-foreground text-base leading-relaxed">
                    Advanced Phishing Guard System (APGS) is a powerful, unified security scanning platform designed to protect you from modern threats. Our advanced phishing detection system analyzes URLs in real-time to identify malicious links that could compromise your security. Using machine learning algorithms and comprehensive threat databases, we check for suspicious patterns, domain reputation, and known phishing indicators.
                  </p>
                  <p className="text-muted-foreground text-base leading-relaxed">
                    Whether you're clicking a link in an email, checking file safety, validating passwords, or verifying suspicious URLs, our tool provides instant results with detailed explanations of potential risks and security recommendations. No required signup for quick testing, with full historical tracking for signed-in users.
                  </p>
                  <div className="flex flex-wrap gap-3 pt-2">
                    <div className="flex items-center gap-2 text-sm text-primary">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Real-time Analysis</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-primary">
                      <Zap className="w-4 h-4" />
                      <span>Instant Results</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-primary">
                      <Lock className="w-4 h-4" />
                      <span>Privacy Focused</span>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl bg-card/70 p-6 border border-border">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="text-sm">Safe URLs verified instantly</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <span className="text-sm">Malicious links blocked</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <span className="text-sm">Suspicious sites flagged</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span className="text-sm">Detailed security reports</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Why Security Checks Matter Section */}
          <section id="why-security" className="space-y-10 scroll-mt-[120px] transition-all duration-300">
            <div className="text-center space-y-4 px-4">
              <h2 
                className="font-heading font-bold bg-gradient-to-r from-primary via-cyan-400 to-blue-500 bg-clip-text text-transparent"
                style={{
                  fontSize: 'clamp(1.5rem, 5vw, 2.25rem)',
                  lineHeight: '1.2',
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word'
                }}
              >
                Why Security Checks Matter
              </h2>
              <p className="text-muted-foreground text-base md:text-lg max-w-3xl mx-auto">
                Protect your digital life with comprehensive security scanning. Every check is designed to keep you safe from modern cyber threats.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card 1: URL Security */}
              <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_8px_30px_rgba(0,255,136,0.15)]">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-cyan-500/20 border border-primary/30 flex items-center justify-center">
                      <Link className="w-7 h-7 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-heading font-bold text-foreground mb-1">URL Security</h3>
                      <p className="text-sm text-muted-foreground">Real-time link analysis</p>
                    </div>
                  </div>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">Detect phishing and malicious links</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">Prevent fake login pages</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">Analyze domain reputation and patterns</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Card 2: Email Breach Check */}
              <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/30 hover:shadow-[0_8px_30px_rgba(0,212,255,0.15)]">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-400/20 to-blue-500/20 border border-cyan-400/30 flex items-center justify-center">
                      <Mail className="w-7 h-7 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-heading font-bold text-foreground mb-1">Email Breach Check</h3>
                      <p className="text-sm text-muted-foreground">Data breach monitoring</p>
                    </div>
                  </div>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">Check if email is exposed in data breaches</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">Prevent account takeover risks</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <ShieldCheck className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">Stay informed about compromised data</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Card 3: File Security */}
              <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/30 hover:shadow-[0_8px_30px_rgba(59,130,246,0.15)]">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 flex items-center justify-center">
                      <FileCheck className="w-7 h-7 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="text-xl font-heading font-bold text-foreground mb-1">File Security</h3>
                      <p className="text-sm text-muted-foreground">Malware detection & prevention</p>
                    </div>
                  </div>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">Scan files for malware and threats</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">Prevent harmful downloads</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <FileCheck className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">Ensure file safety before use</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Card 4: Password Security */}
              <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 transition-all duration-300 hover:-translate-y-1 hover:border-purple-500/30 hover:shadow-[0_8px_30px_rgba(168,85,247,0.15)]">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center">
                      <Lock className="w-7 h-7 text-purple-500" />
                    </div>
                    <div>
                      <h3 className="text-xl font-heading font-bold text-foreground mb-1">Password Security</h3>
                      <p className="text-sm text-muted-foreground">Strength & breach analysis</p>
                    </div>
                  </div>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <Lock className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">Detect weak and reused passwords</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">Check for leaked passwords in breaches</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <ShieldCheck className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">Improve overall account security</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Stats Section */}
          <section id="stats" className="relative overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-r from-blue-500/10 via-primary/5 to-cyan-500/10 p-10 backdrop-blur-sm transition-all duration-300 scroll-mt-[120px]">
            {/* Decorative gradient background */}
            <div className="absolute inset-0 opacity-30 bg-gradient-to-r from-blue-500/5 via-transparent to-cyan-500/5 pointer-events-none rounded-xl"></div>
            
            <div className="relative z-10 space-y-8">
              <div className="text-center space-y-2 px-4">
                <h2 
                  className="font-heading font-bold text-foreground"
                  style={{
                    fontSize: 'clamp(1.25rem, 4vw, 1.875rem)',
                    lineHeight: '1.2',
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word'
                  }}
                >
                  Platform Statistics
                </h2>
                <p className="text-muted-foreground text-sm md:text-base">Protecting users worldwide with real-time threat detection</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                {/* Total Scans */}
                <div className="flex flex-col items-center justify-center space-y-3 group">
                  <div className="text-4xl md:text-5xl font-heading font-bold text-primary transition-transform group-hover:scale-110">
                    {displayedScans24h.toLocaleString()}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="text-2xl">🔍</span>
                    <p className="text-sm md:text-base font-medium">Total Scans</p>
                  </div>
                </div>
                
                {/* Total Users */}
                <div className="flex flex-col items-center justify-center space-y-3 group">
                  <div className="text-4xl md:text-5xl font-heading font-bold text-cyan-400 transition-transform group-hover:scale-110">
                    {displayedActiveUsers.toLocaleString()}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="text-2xl">👥</span>
                    <p className="text-sm md:text-base font-medium">Total Users</p>
                  </div>
                </div>
                
                {/* Protection 24/7 */}
                <div className="flex flex-col items-center justify-center space-y-3 group">
                  <div className="text-4xl md:text-5xl font-heading font-bold text-green-400 transition-transform group-hover:scale-110">
                    24/7
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="text-2xl">🛡️</span>
                    <p className="text-sm md:text-base font-medium">Protection</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section id="faq" className="space-y-6 transition-all duration-300 scroll-mt-[120px]">
            <h2 className="text-2xl font-heading font-bold">Frequently Asked Questions</h2>
            <div className="space-y-3">
              <FaqItem
                question="How does the phishing link checker work?"
                answer="Our tool analyzes URLs using multiple security layers: domain reputation checking, pattern recognition for suspicious URLs, SSL certificate validation, and cross-referencing with known threat databases. It provides instant results with detailed explanations."
              />
              <FaqItem
                question="How to identify URL phishing?"
                answer="Look for suspicious elements like misspelled domains, unusual URL structures, requests for personal information, urgent language, or links from untrusted sources. Our scanner automatically detects these patterns and more."
              />
              <FaqItem
                question="What is a safe URL?"
                answer="Safe URLs typically have HTTPS encryption, legitimate domain names, and come from trusted sources. They don't request sensitive information unexpectedly and don't contain suspicious characters or redirects."
              />
              <FaqItem
                question="What is a suspicious URL?"
                answer="Suspicious URLs may use URL shortening to hide the real destination, contain random characters, mimic legitimate sites with slight variations, or lead to unexpected redirects. Always verify before clicking."
              />
            </div>
          </section>

          {/* Contact Section */}
          <section id="contact" className="rounded-xl border border-border p-6 bg-card/75 space-y-4 scroll-mt-[120px] transition-all duration-300">
            <h2 className="text-2xl font-heading font-bold">Contact</h2>
            <div className="flex flex-col sm:flex-row gap-4 text-muted-foreground text-sm">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" />
                <span>support.apgs@gmail.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary" />
                <span>+91 7008584414</span>
              </div>
            </div>
            <form onSubmit={handleContactSubmit} className="space-y-3">
              <input
                type="text"
                placeholder="Name"
                value={contact.name}
                onChange={(e) => setContact((s) => ({ ...s, name: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={contact.email}
                onChange={(e) => setContact((s) => ({ ...s, email: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
                required
              />
              <textarea
                placeholder="Message"
                value={contact.message}
                onChange={(e) => setContact((s) => ({ ...s, message: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
                rows={4}
                required
              />
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2.5 rounded-lg transition-all duration-300 shadow-[0_0_15px_rgba(0,255,156,0.2)] hover:shadow-[0_0_20px_rgba(0,255,156,0.4)] disabled:opacity-70"
                disabled={contactLoading || sent}
              >
                {contactLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </span>
                ) : sent ? (
                  "Message Received!"
                ) : (
                  "Send Message"
                )}
              </Button>
            </form>
          </section>
        </main>
      </div>

      {/* ========== SCANNING VIEW SECTION ========== */}
      <div
        className={`transition-all duration-300 ${
          currentView === "scanning" ? "block opacity-100" : "hidden opacity-0"
        }`}
      >
        {currentView === "scanning" && console.log("[DEBUG] Rendering scanning view, scanActiveTab is:", scanActiveTab)}
        <main className="max-w-6xl mx-auto px-4 py-10 space-y-8">
          {/* Check if guest limit is exceeded */}
          {!userId && !canGuestScan().allowed ? (
            // GUEST LIMIT EXCEEDED - Show restriction message
            <div className="text-center py-20 space-y-6">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-3xl font-heading font-bold text-foreground">Scanning Hub Restricted</h2>
              <p className="text-muted-foreground text-lg max-w-lg mx-auto">
                Daily guest scan limit reached. Try again tomorrow or login for unlimited scans.
              </p>
              <Button onClick={() => navigate("/login")} className="px-8 py-3 text-lg bg-primary hover:bg-primary/90">
                Login to Access
              </Button>
            </div>
          ) : userId ? (
            // LOGGED-IN USERS - Show full Scanning Hub
            <>
              {/* Scanning Hub - Stats Dashboard */}
              <section className="space-y-4">
                <div>
                  <h1 
                    className="font-heading font-bold mb-1"
                    style={{
                      fontSize: 'clamp(1.5rem, 5vw, 1.875rem)',
                      lineHeight: '1.2',
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word'
                    }}
                  >
                    Scanning Hub
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Your scan history is automatically saved.
                  </p>
                </div>
                
                {/* Stats Dashboard Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Safe Scans Card */}
                  <div className="relative overflow-hidden rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 transition-all duration-300 group hover:shadow-lg hover:shadow-emerald-500/20 backdrop-blur-sm">
                    <div className="relative z-10 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl">✔</span>
                      </div>
                      <div>
                        <p className="text-3xl font-heading font-bold text-foreground">{stats.safe}</p>
                        <p className="text-xs text-muted-foreground font-medium mt-1">Safe Scans</p>
                      </div>
                    </div>
                  </div>

                  {/* Suspicious Card */}
                  <div className="relative overflow-hidden rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 transition-all duration-300 group hover:shadow-lg hover:shadow-amber-500/20 backdrop-blur-sm">
                    <div className="relative z-10 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl">⚠</span>
                      </div>
                      <div>
                        <p className="text-3xl font-heading font-bold text-foreground">{Math.max(0, stats.totalScans - stats.safe - stats.threats)}</p>
                        <p className="text-xs text-muted-foreground font-medium mt-1">Suspicious</p>
                      </div>
                    </div>
                  </div>

                  {/* Threats Found Card */}
                  <div className="relative overflow-hidden rounded-xl border border-red-500/30 bg-red-500/10 p-4 transition-all duration-300 group hover:shadow-lg hover:shadow-red-500/20 backdrop-blur-sm">
                    <div className="relative z-10 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl">❌</span>
                      </div>
                      <div>
                        <p className="text-3xl font-heading font-bold text-foreground">{stats.threats}</p>
                        <p className="text-xs text-muted-foreground font-medium mt-1">Threats Found</p>
                      </div>
                    </div>
                  </div>

                  {/* Total Scans Card */}
                  <div className="relative overflow-hidden rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-4 transition-all duration-300 group hover:shadow-lg hover:shadow-cyan-500/20 backdrop-blur-sm">
                    <div className="relative z-10 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl">📊</span>
                      </div>
                      <div>
                        <p className="text-3xl font-heading font-bold text-foreground">{stats.totalScans}</p>
                        <p className="text-xs text-muted-foreground font-medium mt-1">Total Scans</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Tab Selection */}
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
                      onClick={() => setScanActiveTab(tab.id as "url" | "email" | "file" | "password")}
                      className={`py-2 px-3 rounded-lg border transition-all duration-200 ${
                        scanActiveTab === tab.id
                          ? "border-primary text-primary bg-primary/10 shadow-[0_0_8px_hsl(150_100%_45%_/_0.2)]"
                          : "border-border text-muted-foreground hover:border-primary/70"
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2 text-sm font-medium">
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                      </div>
                    </button>
                  ))}
                </div>
              </section>

              {/* Scanner Content - ALL RENDERED, TOGGLED BY CSS */}
              <section className="space-y-4 transition-all duration-300">
                {scanActiveTab === "url" && (
                  <UrlScanner
                    onScanComplete={refreshHistory}
                    isAuthenticated={!!isAuthenticated}
                    userName={userName}
                    scanData={urlScanData}
                    setScanData={setUrlScanData}
                  />
                )}
                {scanActiveTab === "email" && (
                  <EmailBreachChecker
                    onScanComplete={refreshHistory}
                    isAuthenticated={!!isAuthenticated}
                    userName={userName}
                    scanData={emailScanData}
                    setScanData={setEmailScanData}
                  />
                )}
                {scanActiveTab === "file" && (
                  <FileScanner
                    onScanComplete={refreshHistory}
                    isAuthenticated={!!isAuthenticated}
                    userName={userName}
                    scanData={fileScanData}
                    setScanData={setFileScanData}
                  />
                )}
                {scanActiveTab === "password" && (
                  <PasswordChecker
                    onScanComplete={refreshHistory}
                    isAuthenticated={!!isAuthenticated}
                    userName={userName}
                    scanData={passwordScanData}
                    setScanData={setPasswordScanData}
                  />
                )}
              </section>

              {/* Activity History - Only for logged-in users */}
              {userId && (
                <ActivityHistory 
                  history={historyList || []} 
                  onHistoryChange={refreshHistory}
                  userId={userId}
                />
              )}
            </>
          ) : (
            // GUEST MODE - Simplified UI with upgrade prompt
            <>
              {/* Guest Mode Banner */}
              <section className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 via-cyan-500/5 to-blue-500/10 p-8 backdrop-blur-sm">
                <div className="relative z-10">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                          <Shield className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-heading font-bold text-foreground">Guest Mode Active</h2>
                          <p className="text-sm text-muted-foreground">Limited access - Login to unlock full features</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button 
                        onClick={() => navigate("/login")} 
                        className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg transition-all duration-300 hover:scale-105 whitespace-nowrap"
                      >
                        <LogIn className="w-4 h-4 mr-2" />
                        Login / Sign Up
                      </Button>
                    </div>
                  </div>
                </div>
              </section>

              {/* Tab Selection - Available for guests */}
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
                      onClick={() => setScanActiveTab(tab.id as "url" | "email" | "file" | "password")}
                      className={`py-2 px-3 rounded-lg border transition-all duration-200 ${
                        scanActiveTab === tab.id
                          ? "border-primary text-primary bg-primary/10 shadow-[0_0_8px_hsl(150_100%_45%_/_0.2)]"
                          : "border-border text-muted-foreground hover:border-primary/70"
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2 text-sm font-medium">
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                      </div>
                    </button>
                  ))}
                </div>
              </section>

              {/* Scanner Content - Available for guests */}
              <section className="space-y-4 transition-all duration-300">
                {scanActiveTab === "url" && (
                  <UrlScanner
                    onScanComplete={refreshHistory}
                    isAuthenticated={false}
                    userName=""
                    scanData={urlScanData}
                    setScanData={setUrlScanData}
                  />
                )}
                {scanActiveTab === "email" && (
                  <EmailBreachChecker
                    onScanComplete={refreshHistory}
                    isAuthenticated={false}
                    userName=""
                    scanData={emailScanData}
                    setScanData={setEmailScanData}
                  />
                )}
                {scanActiveTab === "file" && (
                  <FileScanner
                    onScanComplete={refreshHistory}
                    isAuthenticated={false}
                    userName=""
                    scanData={fileScanData}
                    setScanData={setFileScanData}
                  />
                )}
                {scanActiveTab === "password" && (
                  <PasswordChecker
                    onScanComplete={refreshHistory}
                    isAuthenticated={false}
                    userName=""
                    scanData={passwordScanData}
                    setScanData={setPasswordScanData}
                  />
                )}
              </section>

              {/* Guest Info Message */}
              <section className="text-center py-4 px-6 rounded-xl border border-dashed border-border bg-muted/10">
                <p className="text-sm text-muted-foreground">
                  📝 You have <span className="text-primary font-semibold">3 free scans per day</span>. 
                  Login to unlock unlimited scans and save your history.
                </p>
              </section>
            </>
          )}
        </main>
      </div>
      </div>

      {/* ========== PREVENTION VIEW SECTION ========== */}
      <div
        className={`transition-all duration-300 ${
          currentView === "prevention" ? "block opacity-100" : "hidden opacity-0"
        }`}
      >
        <main className="max-w-7xl mx-auto px-4 py-12 space-y-16">
          {/* Hero Section */}
          <section className="text-center space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold bg-gradient-to-r from-primary via-cyan-400 to-blue-500 bg-clip-text text-transparent">
              How to Prevent Phishing Attacks
            </h1>
            <p className="text-muted-foreground text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
              Stay protected with proven security practices. Learn essential techniques to identify and prevent phishing attempts before they compromise your data.
            </p>
          </section>

          {/* Main Prevention Cards */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1: MFA */}
            <div className="group relative overflow-hidden rounded-2xl border border-primary/30 bg-white/5 backdrop-blur-xl p-8 transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-[0_8px_30px_rgba(0,255,136,0.15)]">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="flex items-start gap-4 mb-6">
                  <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-cyan-500/20 border border-primary/30 flex items-center justify-center">
                    <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-heading font-bold text-foreground mb-1">Multi-Factor Authentication (MFA)</h3>
                    <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                  </div>
                </div>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground leading-relaxed">Enable MFA on all important accounts (email, banking, social media)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground leading-relaxed">Use authenticator apps (Google Authenticator, Authy) instead of SMS</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground leading-relaxed">Keep backup codes in a secure location for account recovery</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Card 2: Out-of-Band Verification */}
            <div className="group relative overflow-hidden rounded-2xl border border-cyan-400/30 bg-white/5 backdrop-blur-xl p-8 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/50 hover:shadow-[0_8px_30px_rgba(0,212,255,0.15)]">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="flex items-start gap-4 mb-6">
                  <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br from-cyan-400/20 to-blue-500/20 border border-cyan-400/30 flex items-center justify-center">
                    <svg className="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-heading font-bold text-foreground mb-1">Out-of-Band Verification</h3>
                    <p className="text-sm text-muted-foreground">Verify through separate channels</p>
                  </div>
                </div>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground leading-relaxed">Verify suspicious requests by contacting the person directly</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground leading-relaxed">Use a different communication channel (call instead of email)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground leading-relaxed">Never trust urgent requests asking for sensitive information</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Card 3: URL & Certificate Inspection */}
            <div className="group relative overflow-hidden rounded-2xl border border-blue-500/30 bg-white/5 backdrop-blur-xl p-8 transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/50 hover:shadow-[0_8px_30px_rgba(59,130,246,0.15)]">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="flex items-start gap-4 mb-6">
                  <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 flex items-center justify-center">
                    <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-heading font-bold text-foreground mb-1">URL & Certificate Inspection</h3>
                    <p className="text-sm text-muted-foreground">Check before you click</p>
                  </div>
                </div>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground leading-relaxed">Hover over links to preview the actual URL before clicking</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground leading-relaxed">Check for HTTPS and valid SSL certificates on sensitive sites</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground leading-relaxed">Look for misspellings or unusual domain extensions in URLs</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Card 4: Password Managers */}
            <div className="group relative overflow-hidden rounded-2xl border border-purple-500/30 bg-white/5 backdrop-blur-xl p-8 transition-all duration-300 hover:-translate-y-1 hover:border-purple-500/50 hover:shadow-[0_8px_30px_rgba(168,85,247,0.15)]">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="flex items-start gap-4 mb-6">
                  <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center">
                    <Lock className="w-8 h-8 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-heading font-bold text-foreground mb-1">Password Managers</h3>
                    <p className="text-sm text-muted-foreground">Secure password generation & storage</p>
                  </div>
                </div>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground leading-relaxed">Use unique, strong passwords for every account</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground leading-relaxed">Let the password manager generate complex passwords automatically</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground leading-relaxed">Enable auto-fill to avoid typing passwords on suspicious sites</span>
                  </li>
                </ul>
              </div>
            </div>
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
              {[
                { icon: Shield, text: "Keep software and antivirus updated" },
                { icon: Mail, text: "Don't open attachments from unknown senders" },
                { icon: Globe, text: "Use secure, encrypted connections (HTTPS)" },
                { icon: Lock, text: "Lock your devices when not in use" },
                { icon: Eye, text: "Regularly monitor account activity" },
                { icon: AlertTriangle, text: "Report suspicious emails immediately" }
              ].map((tip, index) => {
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
              {[
                { title: "Clicking Urgent Links", description: "Phishers create fake urgency to bypass your critical thinking", icon: AlertTriangle, color: "text-red-400" },
                { title: "Reusing Passwords", description: "One breach can compromise all your accounts with the same password", icon: Lock, color: "text-orange-400" },
                { title: "Ignoring URL Details", description: "Small changes in URLs (paypa1.com vs paypal.com) indicate fraud", icon: Link, color: "text-yellow-400" },
                { title: "Trusting Email Display Names", description: "Display names can be easily spoofed - always check the actual email address", icon: Mail, color: "text-blue-400" }
              ].map((mistake, index) => {
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
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">
                Test Your Security Knowledge
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
                Use our scanning tools to check URLs, emails, files, and passwords for potential threats.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Button
                  onClick={() => switchToScanning()}
                  className="px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg transition-all duration-300 hover:scale-105"
                >
                  Start Scanning Now
                </Button>
                <Button
                  onClick={() => navTo("home")}
                  variant="outline"
                  className="px-8 py-3 border-primary text-primary hover:bg-primary/20 font-semibold rounded-lg transition-all duration-300 hover:scale-105"
                >
                  Return to Home
                </Button>
              </div>
            </div>
          </section>
        </main>
      </div>

      {/* ========== QUIZ VIEW SECTION ========== */}
      <div
        className={`transition-all duration-300 ${
          currentView === "quiz" ? "block opacity-100" : "hidden opacity-0"
        }`}
      >
        {currentView === "quiz" && (
          <main className="max-w-6xl mx-auto px-4 py-10">
            {!userId ? (
              // GUEST - Show login prompt
              <div className="text-center py-20 space-y-6">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-3xl font-heading font-bold text-foreground">Login Required</h2>
                <p className="text-muted-foreground text-lg max-w-md mx-auto">
                  Please login to access the Security Quiz and test your cybersecurity awareness.
                </p>
                <div className="flex gap-3 justify-center">
                  <Button
                    onClick={() => navigate("/login")}
                    className="px-6 bg-primary hover:bg-primary/90"
                  >
                    Login to Access
                  </Button>
                  <Button
                    onClick={() => navTo("home")}
                    variant="outline"
                    className="px-6"
                  >
                    Back to Home
                  </Button>
                </div>
              </div>
            ) : (
              // LOGGED-IN - Show quiz component
              <SecurityQuizComponent />
            )}
          </main>
        )}
      </div>

      {/* ========== BACK TO TOP BUTTON ========== */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-40 bg-primary hover:bg-primary/90 text-primary-foreground p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110"
          aria-label="Back to top"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}

      {/* ========== FOOTER (FULL WIDTH) ========== */}
      <footer className="w-full bg-card/50 mt-16">
        {/* Top border glow effect */}
        <div className="h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
        
        <div className="max-w-6xl mx-auto px-4 py-12">
          {/* Footer Links Grid - 4 Columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10 mb-10">
            {/* Column 1: Brand */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <img 
                  src="/apgs-logo.png" 
                  alt="APGS Logo" 
                  className="h-10 w-auto object-contain" 
                  style={{ filter: 'drop-shadow(0 0 8px rgba(0, 255, 156, 0.3))' }}
                />
                <h3 className="text-xl font-heading font-bold text-primary">APGS</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                APGS (Advanced Phishing Guard System) is a cybersecurity platform that detects phishing URLs, checks data breaches, analyzes files, and strengthens password security.
              </p>
              <p className="text-xs text-primary/80 font-medium italic">
                "Your first line of defense against phishing."
              </p>
            </div>
            
            {/* Column 2: Platform */}
            <div className="space-y-4">
              <h4 className="font-heading font-semibold text-foreground text-sm uppercase tracking-wide">Platform</h4>
              <nav className="space-y-3">
                <button 
                  onClick={() => switchToScanning("url")} 
                  className="text-sm text-muted-foreground hover:text-primary transition-all duration-200 block hover:translate-x-1 hover:drop-shadow-[0_0_8px_hsl(150_100%_45%_/_0.4)]"
                >
                  URL Scanner
                </button>
                <button 
                  onClick={() => switchToScanning("email")} 
                  className="text-sm text-muted-foreground hover:text-primary transition-all duration-200 block hover:translate-x-1 hover:drop-shadow-[0_0_8px_hsl(150_100%_45%_/_0.4)]"
                >
                  Email Checker
                </button>
                <button 
                  onClick={() => switchToScanning("file")} 
                  className="text-sm text-muted-foreground hover:text-primary transition-all duration-200 block hover:translate-x-1 hover:drop-shadow-[0_0_8px_hsl(150_100%_45%_/_0.4)]"
                >
                  File Analysis
                </button>
                <button 
                  onClick={() => switchToScanning("password")} 
                  className="text-sm text-muted-foreground hover:text-primary transition-all duration-200 block hover:translate-x-1 hover:drop-shadow-[0_0_8px_hsl(150_100%_45%_/_0.4)]"
                >
                  Password Checker
                </button>
              </nav>
            </div>
            
            {/* Column 3: Security */}
            <div className="space-y-4">
              <h4 className="font-heading font-semibold text-foreground text-sm uppercase tracking-wide">Security</h4>
              <nav className="space-y-3">
                <button 
                  onClick={() => switchToPrevention()} 
                  className="text-sm text-muted-foreground hover:text-primary transition-all duration-200 block hover:translate-x-1 hover:drop-shadow-[0_0_8px_hsl(150_100%_45%_/_0.4)]"
                >
                  Prevention Guide
                </button>
                {!authLoading && isAuthenticated && (
                  <button 
                    onClick={() => switchToQuiz()} 
                    className="text-sm text-muted-foreground hover:text-primary transition-all duration-200 block hover:translate-x-1 hover:drop-shadow-[0_0_8px_hsl(150_100%_45%_/_0.4)]"
                  >
                    Security Quiz
                  </button>
                )}
              </nav>
            </div>
            
            {/* Column 4: Quick Links */}
            <div className="space-y-4">
              <h4 className="font-heading font-semibold text-foreground text-sm uppercase tracking-wide">Quick Links</h4>
              <nav className="space-y-3">
                <button 
                  onClick={() => navTo("home")} 
                  className="text-sm text-muted-foreground hover:text-primary transition-all duration-200 block hover:translate-x-1 hover:drop-shadow-[0_0_8px_hsl(150_100%_45%_/_0.4)]"
                >
                  Home
                </button>
                <button 
                  onClick={() => navTo("contact")} 
                  className="text-sm text-muted-foreground hover:text-primary transition-all duration-200 block hover:translate-x-1 hover:drop-shadow-[0_0_8px_hsl(150_100%_45%_/_0.4)]"
                >
                  Contact
                </button>
                <button 
                  onClick={() => switchToScanning()} 
                  className="text-sm text-muted-foreground hover:text-primary transition-all duration-200 block hover:translate-x-1 hover:drop-shadow-[0_0_8px_hsl(150_100%_45%_/_0.4)]"
                >
                  Scanning
                </button>
              </nav>
            </div>
          </div>
          
          {/* Social Icons & Legal Links */}
          <div className="border-t border-border/50 pt-8 mb-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              {/* Social Icons */}
              <div className="flex items-center gap-4">
                <a 
                  href="https://github.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-all duration-200 hover:scale-110"
                  aria-label="GitHub"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 2.694.56 1.983-1.815 5.108-2.567 5.108-2.567 2.694-.322 4.023.469 4.023.469 1.155 2.958 1.155 2.958.657 1.155.657 1.155.217.743.217 1.618 0 1.166-.045 2.118-.075 2.374-.418.467-.128.793.966.997 1.305 1.361 2.114 3.306 1.593 4.213 1.247.064-.466.174-.978.322-1.437-2.568-.583-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 2.694.56 1.983-1.815 5.108-2.567 5.108-2.567 2.694-.322 4.023.469 4.023.469 1.155 2.958 1.155 2.958.657 1.155.657 1.155.217.743.217 1.618 0 1.166-.045 2.118-.075 2.374-.418.467-.128.793.966.997 1.305 1.361 2.114 3.306 1.593 4.213 1.247.064-.466.174-.978.322-1.437-2.568-.583-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 2.694.56 1.983-1.815 5.108-2.567 5.108-2.567"/>
                  </svg>
                </a>
                <a 
                  href="https://linkedin.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-all duration-200 hover:scale-110"
                  aria-label="LinkedIn"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              </div>
              
              {/* Legal Links */}
              <div className="flex items-center gap-6">
                <a 
                  href="/privacy-policy" 
                  className="text-sm text-muted-foreground hover:text-primary transition-all duration-200 hover:translate-x-1 hover:drop-shadow-[0_0_8px_hsl(150_100%_45%_/_0.4)]"
                >
                  Privacy Policy
                </a>
                <a 
                  href="/terms-of-service" 
                  className="text-sm text-muted-foreground hover:text-primary transition-all duration-200 hover:translate-x-1 hover:drop-shadow-[0_0_8px_hsl(150_100%_45%_/_0.4)]"
                >
                  Terms of Service
                </a>
              </div>
            </div>
          </div>
          
          {/* Copyright */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              © 2026 APGS — Advanced Phishing Guard System
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
