import { Search, Upload, Mail, Lock, CheckCircle, AlertTriangle, Clock } from "lucide-react";
import { type ScanHistoryItem } from "@/lib/mockData";

interface ActivityHistoryProps {
  history: ScanHistoryItem[];
}

const typeIcons = { url: Search, file: Upload, email: Mail, password: Lock };
const statusConfig: Record<string, { color: string; label: string }> = {
  safe: { color: "text-primary", label: "Safe" },
  phishing: { color: "text-destructive", label: "Phishing" },
  breached: { color: "text-destructive", label: "Breached" },
  weak: { color: "text-destructive", label: "Weak" },
  medium: { color: "text-accent", label: "Medium" },
  strong: { color: "text-primary", label: "Strong" },
};

  const ActivityHistory = ({ history }: ActivityHistoryProps) => {
  // Safe default for mapping
  const items = Array.isArray(history) ? history : [];
  
  // Debug: Log received history data
  console.log('📋 ActivityHistory received:', history);
  
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
      <h2 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
        <Clock className="w-5 h-5 text-primary" /> Activity History
      </h2>
      {items.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-6">No scan history yet</p>
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto scrollbar-thin">
          {items.map((item) => {
            const Icon = typeIcons[item.type];
            const config = statusConfig[item.status] || statusConfig.safe;
            const isSafe = item.status === "safe" || item.status === "strong";
            return (
              <div key={item.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded border border-border hover:border-primary/30 transition-colors">
                <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-foreground text-sm font-mono truncate flex-1">{item.target}</span>
                <span className={`flex items-center gap-1 text-xs font-heading ${config.color}`}>
                  {isSafe ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                  {config.label}
                </span>
                <span className="text-muted-foreground text-xs shrink-0">{formatTime(item.timestamp)}</span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default ActivityHistory;
