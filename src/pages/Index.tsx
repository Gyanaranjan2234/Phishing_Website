import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Globe, FileText, Mail, Lock, ShieldCheck, Zap, Phone, Loader2, User, ChevronDown, ArrowUp, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { apiAuth, apiScans, apiContacts } from "@/lib/api-backend";  // FIXED: Using real backend
import { useScrollActiveSection } from "@/hooks/use-scroll-active-section";
import UrlScanner from "@/components/dashboard/UrlScanner";
import EmailBreachChecker from "@/components/dashboard/EmailBreachChecker";
import FileScanner from "@/components/dashboard/FileScanner";
import PasswordChecker from "@/components/dashboard/PasswordChecker";
import ActivityHistory from "@/components/dashboard/ActivityHistory";

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
  const [userId, setUserId] = useState<number | null>(null);

  // ============= VIEW MANAGEMENT =============
  // Single source of truth for current view - NO ROUTING
  // "home" | "scanning" - determines which section is visible via CSS
  // Initialize from localStorage if available, otherwise default to "home"
  const [currentView, setCurrentView] = useState<"home" | "scanning">(() => {
    try {
      const savedView = localStorage.getItem("apgs-lastView");
      return (savedView === "scanning" || savedView === "home") ? savedView : "home";
    } catch {
      return "home";
    }
  });
  const [scanActiveTab, setScanActiveTab] = useState<"url" | "email" | "file" | "password">("url");

  // ============= HOME PAGE STATE =============
  const [stats, setStats] = useState({ totalScans: 0, threats: 0, safe: 0, activeUsers: 0 });
  const [featureLoading, setFeatureLoading] = useState<string | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [contact, setContact] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);
  
  // ============= STATS ANIMATION STATE =============
  const [displayedScans24h, setDisplayedScans24h] = useState(0);
  const [displayedActiveUsers, setDisplayedActiveUsers] = useState(0);

  // ============= SCAN STATE - PRESERVED ACROSS TAB SWITCHES =============
  const [urlScanData, setUrlScanData] = useState({ input: "", result: null as any });
  const [emailScanData, setEmailScanData] = useState({ input: "", result: null as any });
  const [fileScanData, setFileScanData] = useState({ file: null as File | null, result: null as any });
  const [passwordScanData, setPasswordScanData] = useState({ input: "", result: null as any });

  // ============= SCROLL-BASED ACTIVE SECTION (HOME PAGE ONLY) =============
  const { activeSection, setActiveSection } = useScrollActiveSection({
    sectionIds: ["home", "about", "contact"],
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
          setUserId(Number(session.user.id));
        } else {
          setUserName("");
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
    let scansRaf = 0, usersRaf = 0;
    const start = Date.now();
    const duration = 1500;
    
    const animateScans = () => {
      const progress = Math.min(1, (Date.now() - start) / duration);
      setDisplayedScans24h(Math.floor(progress * 1240));
      if (progress < 1) scansRaf = requestAnimationFrame(animateScans);
    };
    
    const animateUsers = () => {
      const progress = Math.min(1, (Date.now() - start) / duration);
      setDisplayedActiveUsers(Math.floor(progress * 8500));
      if (progress < 1) usersRaf = requestAnimationFrame(animateUsers);
    };
    
    scansRaf = requestAnimationFrame(animateScans);
    usersRaf = requestAnimationFrame(animateUsers);
    
    return () => {
      cancelAnimationFrame(scansRaf);
      cancelAnimationFrame(usersRaf);
    };
  }, [currentView]);

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
  const navActiveSection = currentView === "scanning" ? "scanning" : activeSection;

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
      <div className="cyber-grid text-foreground flex-1">
        {/* ========== NAVBAR: ALWAYS VISIBLE, STRUCTURE CONSTANT ========== */}
        <header className="sticky top-0 z-50 border-b border-border bg-card/90 backdrop-blur-lg transition-all duration-200">
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

          {/* NAVBAR: ALWAYS THE SAME STRUCTURE - NO DYNAMIC ADD/REMOVE */}
          <nav className="flex items-center gap-2 text-sm flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{theme === "dark" ? "🌙" : "☀️"}</span>
              <Switch
                checked={theme === "light"}
                onCheckedChange={(checked) => setTheme(checked ? "light" : "dark")}
                className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted/40 transition-colors duration-300"
              />
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
              onClick={() => navTo("about")}
              className={`px-3 py-1 rounded-lg border transition-all duration-300 ${
                navActiveSection === "about"
                  ? "border-primary text-primary shadow-[0_0_12px_hsl(150_100%_45%_/_0.4)]"
                  : "border-border text-foreground hover:border-primary/50 hover:bg-primary/5 hover:text-primary hover:shadow-[0_0_12px_hsl(150_100%_45%_/_0.2)]"
              }`}
            >
              About
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

            {!authLoading && isAuthenticated && (
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 border border-border rounded-full px-3 py-1 bg-card/70 hover:bg-card/90 transition">
                  <User className="w-4 h-4 text-primary" />
                  <span className="hidden sm:inline">{userName || "Profile"}</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="bottom" align="end" className="bg-card border border-border text-foreground">
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
                  className="px-3 py-1 rounded-lg border border-border text-foreground hover:bg-primary/30 hover:border-primary hover:text-primary transition-all duration-200 font-medium"
                >
                  Login
                </button>
                <button
                  onClick={() => navigate("/login?view=signup")}
                  className="px-3 py-1 rounded-lg border border-border text-foreground hover:bg-primary/30 hover:border-primary hover:text-primary transition-all duration-200 font-medium"
                >
                  Sign Up
                </button>
              </>
            )}
          </nav>
        </div>
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
          <div className="w-full">
              <h1
  className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-heading font-bold bg-gradient-to-r from-[#00ff88] via-[#00d4ff] to-[#3b82f6] bg-clip-text text-transparent drop-shadow-lg break-words max-w-full"
  style={{
    backgroundImage: 'linear-gradient(90deg, #00ff88, #00d4ff, #3b82f6)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    filter: 'drop-shadow(0 0 10px rgba(0, 255, 136, 0.2))',
    lineHeight: '1.2',
    letterSpacing: '-0.02em'
  }}
>
  Advanced Phishing Guard System
</h1></div>

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

            {/* Feature Cards */}
            <div className="space-y-6 pt-4 border-t border-border">
              <h3 className="text-xl font-heading font-bold">Features</h3>
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

          {/* Stats Section */}
          <section id="stats" className="relative overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-r from-blue-500/10 via-primary/5 to-cyan-500/10 p-10 backdrop-blur-sm transition-all duration-300 scroll-mt-[120px]">
            {/* Decorative gradient background */}
            <div className="absolute inset-0 opacity-30 bg-gradient-to-r from-blue-500/5 via-transparent to-cyan-500/5 pointer-events-none rounded-xl"></div>
            
            <div className="relative z-10 space-y-8">
              <div className="text-center space-y-2">
                <h2 className="text-2xl md:text-3xl font-heading font-bold text-foreground">Platform Statistics</h2>
                <p className="text-muted-foreground text-sm md:text-base">Protecting users worldwide with real-time threat detection</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                {/* Scans in Last 24 Hours */}
                <div className="flex flex-col items-center justify-center space-y-3 group">
                  <div className="text-4xl md:text-5xl font-heading font-bold text-primary transition-transform group-hover:scale-110">
                    {displayedScans24h.toLocaleString()}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="text-2xl">🔍</span>
                    <p className="text-sm md:text-base font-medium">Scans in Last 24 Hours</p>
                  </div>
                </div>
                
                {/* Active Users */}
                <div className="flex flex-col items-center justify-center space-y-3 group">
                  <div className="text-4xl md:text-5xl font-heading font-bold text-cyan-400 transition-transform group-hover:scale-110">
                    {displayedActiveUsers.toLocaleString()}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="text-2xl">👥</span>
                    <p className="text-sm md:text-base font-medium">Active Users</p>
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
          {/* Login CTA - Only show when not authenticated */}
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

          {/* Scanning Hub - Stats Dashboard */}
          <section className="space-y-4">
            <div>
              <h1 className="text-3xl font-heading font-bold mb-1">Scanning Hub</h1>
              <p className="text-sm text-muted-foreground">
                {isAuthenticated ? "Your scan history is automatically saved." : "Guest mode works without login. Sign in to save history and view results."}
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

          {/* Activity History */}
          {isAuthenticated ? (
            <ActivityHistory history={historyList || []} />
          ) : (
            <div className="rounded-xl border border-border p-4 bg-card/60 text-sm text-muted-foreground">
              Log in to save activity and review history. Guest scans are still available but are not stored.
            </div>
          )}
        </main>
      </div>
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
        <div className="max-w-6xl mx-auto px-4 py-10 border-t border-border">
          {/* Footer Links Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-8">
            {/* Brand Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <img src="/apgs-logo.png" alt="APGS Logo" className="h-8 w-auto object-contain" />
                <h3 className="text-lg font-heading font-bold">APGS</h3>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Advanced Phishing Guard System - Your trusted cybersecurity platform providing real-time protection against cyber threats.
              </p>
            </div>
            
            {/* Platform Links */}
            <div className="space-y-3">
              <h4 className="font-heading font-semibold text-foreground text-sm">Platform</h4>
              <nav className="space-y-2">
                <a href="#about" className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors block">
                  Features
                </a>
                <a href="#contact" className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors block">
                  Contact
                </a>
              </nav>
            </div>
            
            {/* Legal Links */}
            <div className="space-y-3">
              <h4 className="font-heading font-semibold text-foreground text-sm">Legal</h4>
              <nav className="space-y-2">
                <a href="/privacy-policy" className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors block">
                  Privacy Policy
                </a>
                <a href="/terms-of-service" className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors block">
                  Terms of Service
                </a>
              </nav>
            </div>
          </div>
          
          {/* Copyright */}
          <div className="border-t border-border/50 pt-6 text-center">
            <p className="text-xs text-muted-foreground">
              © 2026 Advanced Phishing Guard System. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
