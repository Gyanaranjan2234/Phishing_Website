import { CheckCircle2, XCircle, Target, Database } from "lucide-react";

interface StatsCardsProps {
  totalScans?: number; // Optional as we recalculate
  threats: number;
  safe: number;
  suspicious?: number;
  undetected?: number;
}

const StatsCards = ({ threats, safe, totalScans }: StatsCardsProps) => {
  const actualTotal = totalScans !== undefined ? totalScans : (safe + threats);
  const detectionRate = actualTotal > 0 ? Math.round((threats / actualTotal) * 100) : 0;

  const cards = [
    { 
      label: "Safe Scans", 
      value: safe, 
      icon: CheckCircle2, 
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/30",
      iconColor: "text-emerald-400",
      glowColor: "shadow-emerald-500/20",
    },
    { 
      label: "Threats Found", 
      value: threats, 
      icon: XCircle, 
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/30",
      iconColor: "text-red-400",
      glowColor: "shadow-red-500/20",
    },
    { 
      label: "Detection Rate", 
      value: `${detectionRate}%`, 
      icon: Target, 
      bgColor: "bg-orange-500/10",
      borderColor: "border-orange-500/30",
      iconColor: "text-orange-400",
      glowColor: "shadow-orange-500/20",
    },
    { 
      label: "Total Scans", 
      value: actualTotal, 
      icon: Database, 
      bgColor: "bg-cyan-500/10",
      borderColor: "border-cyan-500/30",
      iconColor: "text-cyan-400",
      glowColor: "shadow-cyan-500/20",
    },
  ];

  // If there are suspicious or undetected scans, we could add small indicators or more cards.
  // Requirement: "Show all counts OR ensure hidden counts are still logically included."
  // For now, I'll stick to the 4-card layout from the image but ensure hidden counts are in 'Total'.
  // If actualTotal != safe + threats, it means suspicious/undetected are > 0.
  
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`relative overflow-hidden rounded-xl border ${card.borderColor} ${card.bgColor} p-4 transition-all duration-300 group hover:shadow-lg ${card.glowColor} backdrop-blur-sm`}
        >
          {/* Background glow effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
          
          {/* Content */}
          <div className="relative z-10 space-y-2">
            <div className="flex items-center justify-between">
              <card.icon className={`w-6 h-6 ${card.iconColor} transition-transform group-hover:scale-110`} />
            </div>
            <div>
              <p className="text-3xl font-heading font-bold text-foreground">{card.value}</p>
              <p className="text-xs text-muted-foreground font-medium mt-1">{card.label}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
