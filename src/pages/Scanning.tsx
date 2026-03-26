import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Globe, FileText, Mail, Lock, ShieldCheck, Zap, Users, Phone, Loader2, User } from "lucide-react";
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

      <main className="max-w-6xl mx-auto px-4 py-10 space-y-8">
        <section className="bg-card/70 rounded-xl border border-border p-6 shadow-lg">
          <h1 className="text-3xl font-heading font-bold mb-2">Scanning Hub</h1>
          <p className="text-muted-foreground">Access all scanning modules in one place. Guest mode works without login. Sign in to save history and view results.</p>
        </section>

        <section className="border border-border rounded-xl bg-card/70 p-4">
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
                className={`py-2 px-3 rounded-lg border transition ${activeTab === tab.id ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground hover:border-primary/70"}`}
              >
                <div className="flex items-center justify-center gap-2 text-sm font-medium">
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          {activeTab === "url" && <UrlScanner onScanComplete={refreshHistory} isAuthenticated={!!isAuthenticated} userName={userName} />}
          {activeTab === "email" && <EmailBreachChecker onScanComplete={refreshHistory} isAuthenticated={!!isAuthenticated} />}
          {activeTab === "file" && <FileScanner onScanComplete={refreshHistory} isAuthenticated={!!isAuthenticated} userName={userName} />}
          {activeTab === "password" && <PasswordChecker onScanComplete={refreshHistory} isAuthenticated={!!isAuthenticated} />}
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
