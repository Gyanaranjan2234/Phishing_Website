import { Search, Upload, Mail, Lock, CheckCircle, AlertTriangle, Clock } from "lucide-react";
import { type ScanHistoryItem } from "@/lib/interfaces";


const typeIcons = { url: Search, file: Upload, email: Mail, password: Lock };
const statusConfig: Record<string, { color: string; label: string }> = {
  safe: { color: "text-primary", label: "Safe" },
  phishing: { color: "text-destructive", label: "Phishing" },
  breached: { color: "text-destructive", label: "Breached" },
  weak: { color: "text-destructive", label: "Weak" },
  very_weak: { color: "text-destructive", label: "Very Weak" },
  strong: { color: "text-emerald-400", label: "Strong" },
  very_strong: { color: "text-primary", label: "Very Strong" },
  low: { color: "text-yellow-500", label: "Low Risk" },
  moderate: { color: "text-yellow-500", label: "Moderate" },
  high: { color: "text-destructive", label: "High Risk" },
  dangerous: { color: "text-destructive", label: "Dangerous" },
};

import { useState, useMemo } from "react";
import { Trash2, Filter, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { apiScans } from "@/lib/api-backend";

interface ActivityHistoryProps {
  history: ScanHistoryItem[];
  onHistoryChange?: () => void;
  userId?: number | null;
}

const ActivityHistory = ({ history, onHistoryChange, userId }: ActivityHistoryProps) => {
  console.log("🕵️ ActivityHistory: props received", { historyLength: history?.length, userId });
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isClearing, setIsClearing] = useState(false);

  // Filtered items based on local state
  const filteredItems = useMemo(() => {
    let items = Array.isArray(history) ? [...history] : [];
    
    // Sort latest first (ensure frontend respects backend order)
    items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    if (filterType !== "all") {
      items = items.filter(item => item.type === filterType);
    }
    
    if (filterStatus !== "all") {
      if (filterStatus === "safe") {
        items = items.filter(item => ["safe", "strong", "very_strong", "clean", "secure"].includes(item.status));
      } else if (filterStatus === "breached") {
        items = items.filter(item => ["phishing", "breached", "infected", "dangerous", "malicious", "high", "threat", "very_weak", "weak"].includes(item.status));
      }
    }
    
    return items;
  }, [history, filterType, filterStatus]);

  const handleClearHistory = async () => {
    console.log("🚀 Clear clicked: Initiating history deletion...");
    
    // Get user from localStorage with multiple fallbacks
    let userIdToUse = userId;
    try {
      const userStr = localStorage.getItem("user");
      const userIdStr = localStorage.getItem("user_id");
      
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user && user.id) userIdToUse = user.id;
      }
      
      if (!userIdToUse && userIdStr) {
        userIdToUse = parseInt(userIdStr);
      }
      
      console.log(`👤 Resolved userId for deletion:`, { 
        propUserId: userId, 
        localStorageUser: userStr ? "present" : "missing",
        localStorageUserId: userIdStr,
        finalUserId: userIdToUse 
      });
    } catch (e) {
      console.error("❌ Error parsing session data:", e);
    }

    if (!userIdToUse || userIdToUse === "undefined" || isNaN(Number(userIdToUse))) {
      console.error("❌ No userId: Could not retrieve valid user ID.", { userIdToUse, userId });
      toast.error("Session error. Please log in again.");
      return;
    }
    
    if (!window.confirm("Delete history? This cannot be undone.")) {
      console.log("❌ Clear History cancelled by user.");
      return;
    }

    setIsClearing(true);
    try {
      console.log(`📡 API Request: DELETE /api/scans/${userIdToUse}`);
      const res = await apiScans.clearHistory(userIdToUse);
      console.log("📡 API Response received:", res);

      if (res.status === 'success') {
        console.log("✅ History cleared successfully in backend.");
        toast.success("History cleared successfully");
        if (onHistoryChange) {
          console.log("🔄 Triggering onHistoryChange callback...");
          await onHistoryChange();
        }
      } else {
        // Handle FastAPI validation error objects or standard error strings
        let errorMsg = "Failed to clear history";
        
        if (res.detail) {
          if (Array.isArray(res.detail)) {
            errorMsg = res.detail.map((d: any) => d.msg).join(", ");
          } else if (typeof res.detail === 'string') {
            errorMsg = res.detail;
          } else {
            errorMsg = JSON.stringify(res.detail);
          }
        } else if (res.message) {
          errorMsg = res.message;
        }

        console.error("❌ Delete failed: Backend returned error", { raw: res, message: errorMsg });
        toast.error(String(errorMsg).slice(0, 100)); // Ensure it's a string for React rendering
      }
    } catch (err) {
      console.error("❌ Network error during history deletion:", err);
      toast.error("Network error. Failed to clear history.");
    } finally {
      setIsClearing(false);
    }
  };
  
  const formatTime = (date: Date) => {
    if (!date) return "Just now";
    try {
      // Calculate time difference using Date objects
      const diff = Date.now() - date.getTime();
      
      // Handle slight future times or very recent times
      if (diff < 60000) return "Just now";
      
      const mins = Math.floor(diff / 60000);
      if (mins < 60) return `${mins}m ago`;
      
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `${hrs}h ago`;
      
      const days = Math.floor(hrs / 24);
      return `${days}d ago`;
    } catch (e) {
      return "Recently";
    }
  };

  return (
    <section className="bg-card border border-border rounded-lg p-6 animate-fade-in-up" style={{ animationDelay: "0.5s" }}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h2 className="font-heading font-semibold text-foreground flex items-center gap-2 text-lg">
          <Clock className="w-5 h-5 text-primary" /> Activity History
        </h2>
        
        <div className="flex flex-wrap items-center gap-2">
          {/* Filters */}
          <div className="flex items-center gap-2 bg-muted/30 px-2 py-1 rounded border border-border">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            <select 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-slate-900 text-xs text-green-400 focus:outline-none border-none cursor-pointer p-1 rounded-md"
            >
              <option value="all" className="bg-slate-900 text-green-400">All Types</option>
              <option value="password" className="bg-slate-900 text-green-400">Passwords</option>
              <option value="email" className="bg-slate-900 text-green-400">Emails</option>
              <option value="url" className="bg-slate-900 text-green-400">URLs</option>
              <option value="file" className="bg-slate-900 text-green-400">Files</option>
            </select>
            <div className="w-px h-3 bg-border mx-1" />
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-900 text-xs text-green-400 focus:outline-none border-none cursor-pointer p-1 rounded-md"
            >
              <option value="all" className="bg-slate-900 text-green-400">All Status</option>
              <option value="safe" className="bg-slate-900 text-green-400">Safe Only</option>
              <option value="breached" className="bg-slate-900 text-green-400">Threats Only</option>
            </select>
          </div>

          {/* Clear Button */}
          {history && history.length > 0 && (
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={handleClearHistory}
              disabled={isClearing}
              className="h-8 text-xs hover:shadow-[0_0_10px_rgba(239,68,68,0.3)] transition-all gap-1.5 px-3 whitespace-nowrap"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {isClearing ? "Clearing..." : "Clear History"}
            </Button>
          )}
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-border rounded-lg bg-muted/10">
          <p className="text-muted-foreground text-sm">
            {history.length === 0 ? "No scan history yet" : "No results match your filters"}
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
          {filteredItems.map((item) => {
            const Icon = typeIcons[item.type] || Search;
            // Map status with fallback
            let statusKey = item.status;
            if (statusKey === "very strong") statusKey = "very_strong";
            if (statusKey === "very weak") statusKey = "very_weak";
            
            const config = statusConfig[statusKey] || statusConfig.safe;
            const isSafe = ["safe", "strong", "very_strong", "clean", "secure"].includes(item.status);
            
            return (
              <div key={item.id} className="flex items-center gap-3 p-3 bg-muted/20 rounded border border-border hover:border-primary/40 hover:bg-muted/40 transition-all group">
                <div className={`p-2 rounded bg-background border border-border group-hover:border-primary/20 transition-colors`}>
                  <Icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-foreground text-sm font-mono truncate">{item.target}</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{item.type}</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-background border border-border ${config.color}`}>
                    {isSafe ? <CheckCircle className="w-2.5 h-2.5" /> : <AlertTriangle className="w-2.5 h-2.5" />}
                    {config.label.toUpperCase()}
                  </span>
                  <span className="text-muted-foreground text-[10px] font-mono">{formatTime(item.timestamp)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default ActivityHistory;
