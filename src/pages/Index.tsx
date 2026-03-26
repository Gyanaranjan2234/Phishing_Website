import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Globe, FileText, Mail, Lock, ShieldCheck, Zap, Users, Phone, Loader2, User, ChevronDown, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { apiAuth, apiScans } from "@/lib/api";

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

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [theme, setTheme] = useState<"dark" | "light">(() => (localStorage.getItem("apgs-theme") === "light" ? "light" : "dark"));
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [stats, setStats] = useState({ totalScans: 0, threats: 0, safe: 0, activeUsers: 0 });
  const [activeSection, setActiveSection] = useState<string>("home");
  const [featureLoading, setFeatureLoading] = useState<string | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);

  const { data: statsData, refetch: refetchStats } = useQuery({
    queryKey: ['stats'],
    queryFn: apiScans.getStats,
  });


  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("apgs-theme", theme);
  }, [theme]);

  useEffect(() => {
    const getSession = async () => {
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
    getSession();
  }, []);
  useEffect(() => {
    if (!statsData?.stats) return;
    const target = statsData.stats;
    let raf = 0;
    const start = Date.now();
    const duration = 1000;
    const animate = () => {
      const progress = Math.min(1, (Date.now() - start) / duration);
      setStats({
        totalScans: Math.floor(progress * (target.totalScans || 0)),
        threats: Math.floor(progress * (target.threats || 0)),
        safe: Math.floor(progress * (target.safe || 0)),
        activeUsers: Math.floor(progress * (target.activeUsers || 0)),
      });
      if (progress < 1) raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [statsData]);

  useEffect(() => {
    const sectionIds = ["home", "about", "faq", "contact"];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0.3 }
    );

    sectionIds.forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const refreshStats = () => refetchStats();

  const [contact, setContact] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    toast.success("Thanks! Your message has been queued for support.");
    setContact({ name: "", email: "", message: "" });
    setTimeout(() => setSent(false), 2200);
  };

  const goToScan = () => {
    navigate("/scanning");
  };

  const logout = async () => {
    await apiAuth.logout();
    setIsAuthenticated(false);
    setUserName("");
    navigate("/");
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setActiveSection(sectionId);
    }
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
      navigate("/scanning", { state: { openTab: tab } });
    }, 350);
  };

  const navTo = (anchor: string) => {
    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(() => scrollToSection(anchor), 250);
    } else {
      scrollToSection(anchor);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const featureCards = useMemo(
    () => [
      { icon: Globe, title: "URL Scanner", text: "Detect phishing and malicious links instantly.", sectionId: "url-scan" },
      { icon: Mail, title: "Email Checker", text: "Validate email safety and breach status.", sectionId: "email-scan" },
      { icon: FileText, title: "File Analysis", text: "Scan uploads for hidden malware signatures.", sectionId: "file-scan" },
      { icon: Lock, title: "Password Verdict", text: "Analyze strength and breach history.", sectionId: "password-scan" },
    ],
    []
  );

  return (
    <div className="min-h-screen cyber-grid text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur-lg">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-heading font-bold text-primary">APGS</span>
            <span className="text-xs text-muted-foreground">Authentication Protocol Gateway Secure</span>
          </div>
          <nav className="flex items-center gap-2 text-sm flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{theme === "dark" ? "Dark" : "Light"}</span>
              <Switch
                checked={theme === "light"}
                onCheckedChange={(checked) => setTheme(checked ? "light" : "dark")}
                className="data-[state=checked]:bg-primary"
              />
            </div>
            <button onClick={() => navTo("home")} className={`px-3 py-1 rounded-lg border ${activeSection === "home" ? "border-primary text-primary" : "border-border"} hover:bg-card/70 transition`}>
              Home
            </button>
            <button onClick={() => navTo("about")} className={`px-3 py-1 rounded-lg border ${activeSection === "about" ? "border-primary text-primary" : "border-border"} hover:bg-card/70 transition`}>
              About
            </button>
            <button onClick={() => navTo("contact")} className={`px-3 py-1 rounded-lg border ${activeSection === "contact" ? "border-primary text-primary" : "border-border"} hover:bg-card/70 transition`}>
              Contact
            </button>
            <button onClick={() => navigate("/scanning")} className={`px-3 py-1 rounded-lg border ${window.location.pathname === "/scanning" ? "border-primary text-primary" : "border-border"} hover:bg-card/70 transition`}>
              Scanning
            </button>
            {!isAuthenticated ? (
              <>
                <button onClick={() => navigate("/login")} className="px-3 py-1 rounded-lg border border-border hover:bg-card/70 transition">
                  Login
                </button>
                <button onClick={() => navigate("/login?view=signup")} className="px-3 py-1 rounded-lg border border-border hover:bg-card/70 transition">
                  Sign Up
                </button>
              </>
            ) : (
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
          </nav>
        </div>
      </header>

      <main id="home" className="max-w-6xl mx-auto px-4 py-10 space-y-16">
        <section className="grid gap-8 lg:grid-cols-2 items-center">
          <div className="space-y-6">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold">
              Authentication Protocol<br /> Gateway Secure
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg">
              Powerful web security scanning for URLs, emails, files and passwords. No required signup for quick testing, with full historical tracking for signed-in users.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button onClick={goToScan} className="px-6 py-2.5">Start Scanning</Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-card/70 p-4 border border-border hover:border-primary/50 shadow-[0_0_12px_hsl(150_100%_45%_/_0.15)] hover:shadow-[0_0_16px_hsl(150_100%_45%_/_0.25)] transition-all duration-300 hover:scale-105 cursor-default">Secure Live URL Checks</div>
            <div className="rounded-xl bg-card/70 p-4 border border-border hover:border-primary/50 shadow-[0_0_12px_hsl(150_100%_45%_/_0.15)] hover:shadow-[0_0_16px_hsl(150_100%_45%_/_0.25)] transition-all duration-300 hover:scale-105 cursor-default">Email Breach Discovery</div>
            <div className="rounded-xl bg-card/70 p-4 border border-border hover:border-primary/50 shadow-[0_0_12px_hsl(150_100%_45%_/_0.15)] hover:shadow-[0_0_16px_hsl(150_100%_45%_/_0.25)] transition-all duration-300 hover:scale-105 cursor-default">File Malware Analysis</div>
            <div className="rounded-xl bg-card/70 p-4 border border-border hover:border-primary/50 shadow-[0_0_12px_hsl(150_100%_45%_/_0.15)] hover:shadow-[0_0_16px_hsl(150_100%_45%_/_0.25)] transition-all duration-300 hover:scale-105 cursor-default">Password Strength AI</div>
          </div>
        </section>

        <section id="about" className="space-y-10 scroll-mt-32">
          <div className="space-y-6">
            <h2 className="text-2xl font-heading font-bold">About APGS</h2>
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <p className="text-muted-foreground text-base leading-relaxed">
                  APGS is a powerful, unified security scanning platform designed to protect you from modern threats. Our advanced phishing detection system analyzes URLs in real-time to identify malicious links that could compromise your security. Using machine learning algorithms and comprehensive threat databases, we check for suspicious patterns, domain reputation, and known phishing indicators.
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

          <div className="space-y-6 pt-4 border-t border-border">
            <h3 className="text-xl font-heading font-bold">Features</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {featureCards.map((card, i) => {
                const Icon = card.icon;
                const loading = featureLoading === card.sectionId;
                return (
                  <article
                    key={i}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleFeatureCardClick(card.sectionId)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        handleFeatureCardClick(card.sectionId);
                      }
                    }}
                    className={`rounded-xl border p-4 bg-card/75 cursor-pointer transition-all duration-200 ${activeSection === card.sectionId ? "border-primary shadow-[0_0_18px_hsl(150_100%_45%_/_0.35)] scale-105" : "border-border hover:shadow-[0_0_18px_hsl(150_100%_45%_/_0.2)] hover:scale-105"}`}
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

        <section id="faq" className="space-y-6">
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

        <section id="contact" className="rounded-xl border border-border p-6 bg-card/75 space-y-4">
          <h2 className="text-2xl font-heading font-bold">Contact</h2>
          <div className="flex flex-col sm:flex-row gap-4 text-muted-foreground text-sm">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-primary" />
              <span>gyana.tcr20@gmail.com</span>
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
            <Button type="submit" className="w-full rounded-lg py-2.5">
              {sent ? "Message sent" : "Send Message"}
            </Button>
          </form>
        </section>
      </main>

      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-40 bg-primary hover:bg-primary/90 text-primary-foreground p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110"
          aria-label="Back to top"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default Index;
