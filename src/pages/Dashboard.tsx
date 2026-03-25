import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getStats, getHistory } from "@/lib/mockData";
import StatsCards from "@/components/dashboard/StatsCards";
import UrlScanner from "@/components/dashboard/UrlScanner";
import FileScanner from "@/components/dashboard/FileScanner";
import EmailBreachChecker from "@/components/dashboard/EmailBreachChecker";
import PasswordChecker from "@/components/dashboard/PasswordChecker";
import ActivityHistory from "@/components/dashboard/ActivityHistory";

const Dashboard = () => {
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleLogout = () => {
    localStorage.removeItem("apgs-auth");
    navigate("/login");
  };

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const stats = getStats();
  const history = getHistory();

  return (
    <div className="min-h-screen cyber-grid">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary drop-shadow-[0_0_8px_hsl(150_100%_45%/0.5)]" />
            <span className="font-heading font-bold text-primary text-lg">APGS</span>
            <span className="hidden sm:inline text-muted-foreground text-xs font-mono ml-1">Authentication Protocol Gateway Secure</span>
          </div>
          <Button variant="ghost" onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6" key={refreshKey}>
        <div className="animate-fade-in-up">
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground">Security Dashboard</h1>
          <p className="text-muted-foreground mt-1">Monitor threats, analyze URLs, and check for breaches</p>
        </div>

        <StatsCards totalScans={stats.totalScans} threats={stats.threats} safe={stats.safe} />

        <div className="grid lg:grid-cols-2 gap-6">
          <UrlScanner onScanComplete={refresh} />
          <FileScanner onScanComplete={refresh} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <EmailBreachChecker onScanComplete={refresh} />
          <PasswordChecker onScanComplete={refresh} />
        </div>

        <ActivityHistory history={history} />
      </main>
    </div>
  );
};

export default Dashboard;
