import { Shield, AlertTriangle, CheckCircle, Activity } from "lucide-react";

interface StatsCardsProps {
  totalScans: number;
  threats: number;
  safe: number;
}

const StatsCards = ({ totalScans, threats, safe }: StatsCardsProps) => {
  const cards = [
    { label: "Total Scans", value: totalScans, icon: Activity, accent: "text-primary" },
    { label: "Threats Detected", value: threats, icon: AlertTriangle, accent: "text-destructive" },
    { label: "Safe Results", value: safe, icon: CheckCircle, accent: "text-primary" },
    { label: "Security Score", value: totalScans > 0 ? `${Math.round((safe / totalScans) * 100)}%` : "—", icon: Shield, accent: "text-accent" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-card border border-border rounded-lg p-5 hover:border-primary/40 transition-all duration-300 group"
        >
          <div className="flex items-center justify-between mb-3">
            <card.icon className={`w-5 h-5 ${card.accent} group-hover:drop-shadow-[0_0_8px_hsl(150_100%_45%/0.5)] transition-all`} />
          </div>
          <p className="text-2xl font-heading font-bold text-foreground">{card.value}</p>
          <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
