import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  Globe, 
  Mail, 
  FileText, 
  Key,
  ExternalLink,
  Activity,
  AlertCircle,
  Monitor,
  Star,
  ShieldAlert,
  Home,
  LogOut
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { getDashboardData } from "@/lib/api-backend";

interface DashboardData {
  totalScans: number;
  threats: number;
  safe: number;
  suspicious: number;
  successRate: number;
  lastScan: {
    timestamp: string;
    type: string;
    status: string;
  } | null;
  recentScans: Array<{
    id: number;
    type: string;
    target: string;
    status: string;
    timestamp: string;
  }>;
  chartData: Array<{
    date: string;
    total: number;
    safe: number;
    threat: number;
  }>;
}

const ProfileDashboard = ({ userId }: { userId: number }) => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!userId) return;
      
      try {
        setLoading(true);
        setError(null);
        const response = await getDashboardData(userId);
        
        if (response.status === 'success') {
          setDashboardData(response.data);
        } else {
          setError(response.message || 'Failed to load dashboard data');
        }
      } catch (err) {
        console.error('Dashboard fetch error:', err);
        setError('Failed to connect to server');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  const getStatusColor = (status: string) => {
    if (status === 'safe' || status === 'strong' || status === 'very_strong') {
      return 'text-emerald-400';
    }
    if (status === 'phishing' || status === 'breached' || status === 'infected' || status === 'dangerous') {
      return 'text-red-400';
    }
    if (status === 'weak' || status === 'very_weak') {
      return 'text-orange-400';
    }
    return 'text-yellow-400';
  };

  const getStatusBadge = (status: string) => {
    if (status === 'safe' || status === 'strong' || status === 'very_strong') {
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    }
    if (status === 'phishing' || status === 'breached' || status === 'infected' || status === 'dangerous') {
      return 'bg-red-500/10 text-red-400 border-red-500/30';
    }
    if (status === 'weak' || status === 'very_weak') {
      return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
    }
    return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
  };

  const getScanTypeIcon = (type: string) => {
    switch (type) {
      case 'url': return <Globe className="w-4 h-4" />;
      case 'email': return <Mail className="w-4 h-4" />;
      case 'file': return <FileText className="w-4 h-4" />;
      case 'password': return <Key className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Calculate Security Score (0-100)
  const calculateSecurityScore = () => {
    if (!dashboardData || dashboardData.totalScans === 0) return 100;
    
    const threatRatio = dashboardData.threats / dashboardData.totalScans;
    const suspiciousRatio = dashboardData.suspicious / dashboardData.totalScans;
    
    // Score calculation: 100 - (threats * 30% + suspicious * 10%)
    const score = Math.max(0, Math.min(100, Math.round(100 - (threatRatio * 100 * 0.7 + suspiciousRatio * 100 * 0.3))));
    return score;
  };

  const getRiskColor = (score: number) => {
    if (score >= 71) return '#22c55e'; // Green
    if (score >= 41) return '#facc15'; // Yellow
    return '#ef4444'; // Red
  };

  const getRiskLabel = (score: number) => {
    if (score >= 71) return 'LOW RISK';
    if (score >= 41) return 'MODERATE';
    return 'HIGH RISK';
  };

  // Get last login info from localStorage
  const getLastLoginInfo = () => {
    try {
      const lastLogin = localStorage.getItem('last_login_time');
      const lastDevice = localStorage.getItem('last_login_device');
      
      if (lastLogin) {
        return {
          time: formatTimestamp(lastLogin),
          device: lastDevice || 'Unknown device'
        };
      }
    } catch (error) {
      console.error('Error reading last login info:', error);
    }
    
    return {
      time: 'N/A',
      device: 'N/A'
    };
  };

  // Calculate threat intelligence from scan data
  const calculateThreatIntelligence = () => {
    if (!dashboardData || dashboardData.recentScans.length === 0) {
      return {
        recentThreatCount: 0,
        highestRiskType: 'N/A',
        trend: 'stable' as 'increasing' | 'decreasing' | 'stable',
        recommendation: 'No recent scans to analyze'
      };
    }

    const recentScans = dashboardData.recentScans;
    
    // Count recent threats (last 5 scans)
    const recentThreatCount = recentScans.filter(
      scan => scan.status === 'phishing' || scan.status === 'breached' || 
              scan.status === 'infected' || scan.status === 'dangerous'
    ).length;

    // Determine highest risk scan type
    const typeThreats: Record<string, number> = {
      url: 0,
      email: 0,
      file: 0,
      password: 0
    };

    recentScans.forEach(scan => {
      if (scan.status === 'phishing' || scan.status === 'breached' || 
          scan.status === 'infected' || scan.status === 'dangerous' ||
          scan.status === 'weak' || scan.status === 'very_weak') {
        typeThreats[scan.type] = (typeThreats[scan.type] || 0) + 1;
      }
    });

    const highestRiskType = Object.entries(typeThreats)
      .sort((a, b) => b[1] - a[1])[0];

    const typeLabels: Record<string, string> = {
      url: 'URL',
      email: 'Email',
      file: 'File',
      password: 'Password'
    };

    // Calculate trend (compare first half vs second half of recent scans)
    const midPoint = Math.floor(recentScans.length / 2);
    const olderScans = recentScans.slice(midPoint);
    const newerScans = recentScans.slice(0, midPoint);

    const olderThreats = olderScans.filter(
      scan => scan.status === 'phishing' || scan.status === 'breached' || 
              scan.status === 'infected' || scan.status === 'dangerous'
    ).length;

    const newerThreats = newerScans.filter(
      scan => scan.status === 'phishing' || scan.status === 'breached' || 
              scan.status === 'infected' || scan.status === 'dangerous'
    ).length;

    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (newerThreats > olderThreats) trend = 'increasing';
    else if (newerThreats < olderThreats) trend = 'decreasing';

    // Generate smart recommendation
    let recommendation = '';
    const threatLevel = recentThreatCount / recentScans.length;

    if (threatLevel > 0.6) {
      recommendation = 'Critical: High threat activity detected. Review all recent scans immediately and update security protocols.';
    } else if (threatLevel > 0.4) {
      recommendation = 'Warning: Elevated threat levels. Consider enabling additional security measures and reviewing scan results.';
    } else if (threatLevel > 0.2) {
      recommendation = 'Moderate: Some threats detected. Stay vigilant and continue monitoring suspicious activities.';
    } else if (recentThreatCount > 0) {
      recommendation = 'Low risk: Minor threats found. Maintain current security practices and regular scanning.';
    } else {
      recommendation = 'Excellent: No threats detected in recent scans. Continue proactive security monitoring.';
    }

    return {
      recentThreatCount,
      highestRiskType: typeLabels[highestRiskType[0]] || 'N/A',
      trend,
      recommendation
    };
  };

  // Generate alerts based on scan history
  const generateAlerts = () => {
    const alerts: Array<{ type: 'warning' | 'danger' | 'info'; message: string; timestamp?: string }> = [];
    
    if (!dashboardData || dashboardData.recentScans.length === 0) {
      return alerts;
    }

    // Check for threats in recent scans
    const recentThreats = dashboardData.recentScans.filter(
      scan => scan.status === 'phishing' || scan.status === 'breached' || scan.status === 'infected'
    );

    if (recentThreats.length > 0) {
      alerts.push({
        type: 'danger',
        message: `${recentThreats.length} threat${recentThreats.length > 1 ? 's' : ''} detected in recent scans`,
        timestamp: recentThreats[0].timestamp
      });
    }

    // Check for breached emails
    const breachedScans = dashboardData.recentScans.filter(scan => scan.status === 'breached');
    if (breachedScans.length > 0) {
      alerts.push({
        type: 'warning',
        message: 'Email breach detected - Consider changing your password',
        timestamp: breachedScans[0].timestamp
      });
    }

    // Check for weak passwords
    const weakPasswords = dashboardData.recentScans.filter(
      scan => scan.status === 'weak' || scan.status === 'very_weak'
    );
    if (weakPasswords.length > 0) {
      alerts.push({
        type: 'warning',
        message: 'Weak passwords detected - Use stronger passwords',
        timestamp: weakPasswords[0].timestamp
      });
    }

    // High threat ratio warning
    if (dashboardData.totalScans > 5) {
      const threatRatio = dashboardData.threats / dashboardData.totalScans;
      if (threatRatio > 0.3) {
        alerts.push({
          type: 'info',
          message: `High threat detection rate (${Math.round(threatRatio * 100)}%) - Stay vigilant`,
        });
      }
    }

    return alerts.slice(0, 5); // Limit to 5 alerts
  };

  const pieData = [
    { name: 'Safe', value: dashboardData?.safe || 0, color: '#10b981' },
    { name: 'Threats', value: dashboardData?.threats || 0, color: '#ef4444' },
    { name: 'Suspicious', value: dashboardData?.suspicious || 0, color: '#f59e0b' }
  ].filter(item => item.value > 0);

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Skeleton Loading */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-card border border-border rounded-xl p-5 animate-pulse">
              <div className="h-4 bg-muted rounded w-1/2 mb-3"></div>
              <div className="h-8 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/3"></div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-xl p-6 h-80 animate-pulse"></div>
          <div className="bg-card border border-border rounded-xl p-6 h-80 animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <p className="text-red-400 font-medium">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg text-red-400 text-sm transition-all"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Scans */}
        <div className="bg-gradient-to-br from-card to-card/80 border border-border/50 rounded-xl p-5 backdrop-blur-sm hover:border-primary/50 transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-muted-foreground font-medium">Total Scans</p>
            <Shield className="w-5 h-5 text-primary/70" />
          </div>
          <p className="text-3xl font-bold text-foreground mb-1">
            {dashboardData?.totalScans || 0}
          </p>
          <p className="text-xs text-muted-foreground">All time</p>
        </div>

        {/* Threats Detected */}
        <div className="bg-gradient-to-br from-card to-card/80 border border-border/50 rounded-xl p-5 backdrop-blur-sm hover:border-red-500/50 transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-muted-foreground font-medium">Threats</p>
            <AlertTriangle className="w-5 h-5 text-red-400/70" />
          </div>
          <p className="text-3xl font-bold text-red-400 mb-1">
            {dashboardData?.threats || 0}
          </p>
          <p className="text-xs text-muted-foreground">Detected</p>
        </div>

        {/* Safe Results */}
        <div className="bg-gradient-to-br from-card to-card/80 border border-border/50 rounded-xl p-5 backdrop-blur-sm hover:border-emerald-500/50 transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-muted-foreground font-medium">Safe</p>
            <CheckCircle className="w-5 h-5 text-emerald-400/70" />
          </div>
          <p className="text-3xl font-bold text-emerald-400 mb-1">
            {dashboardData?.safe || 0}
          </p>
          <p className="text-xs text-muted-foreground">Clean results</p>
        </div>

        {/* Last Scan */}
        <div className="bg-gradient-to-br from-card to-card/80 border border-border/50 rounded-xl p-5 backdrop-blur-sm hover:border-blue-500/50 transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-muted-foreground font-medium">Last Scan</p>
            <Clock className="w-5 h-5 text-blue-400/70" />
          </div>
          <p className="text-lg font-bold text-foreground mb-1">
            {dashboardData?.lastScan ? formatTimestamp(dashboardData.lastScan.timestamp) : 'N/A'}
          </p>
          <p className="text-xs text-muted-foreground capitalize">
            {dashboardData?.lastScan?.type || 'No scans yet'}
          </p>
        </div>
      </div>

      {/* Security Score & Last Login */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Security Score Card */}
        <div className="bg-card border border-border/50 rounded-xl p-6 flex flex-col items-center relative overflow-hidden h-full shadow-sm">
          {/* Title Section */}
          <div className="w-full mb-8">
            <h3 className="text-lg font-semibold text-foreground">Security Score</h3>
            <p className="text-xs text-muted-foreground">Overall system protection level</p>
          </div>

          <div className="w-full flex-1 flex flex-col items-center justify-center space-y-6">
            {/* Gauge SVG Section */}
            <div className="relative w-full max-w-[300px] flex flex-col items-center">
              {/* SVG Container with optimal aspect ratio for the semi-circle */}
              <div className="w-full aspect-[1.8/1] relative flex items-center justify-center">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 100 65">
                  {/* Gauge Background (Dim) - Radius 44 */}
                  <path
                    d="M 6 55 A 44 44 0 0 1 94 55"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeLinecap="round"
                    className="text-muted/10"
                  />
                  
                  {/* Gradient Definition */}
                  <defs>
                    <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#ef4444" />
                      <stop offset="50%" stopColor="#facc15" />
                      <stop offset="100%" stopColor="#22c55e" />
                    </linearGradient>
                  </defs>

                  {/* Active Arc (Radius 44) */}
                  <path
                    d="M 6 55 A 44 44 0 0 1 94 55"
                    fill="none"
                    stroke="url(#gaugeGradient)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray="138.23"
                    strokeDashoffset={138.23 * (1 - calculateSecurityScore() / 100)}
                    style={{ 
                      transition: 'stroke-dashoffset 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    }}
                  />

                  {/* Pointer (Needle) - Centered at 50, 55 */}
                  <g 
                    transform={`rotate(${(calculateSecurityScore() / 100) * 180 - 90}, 50, 55)`}
                    style={{ transition: 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                  >
                    <line 
                      x1="50" y1="55" x2="50" y2="18" 
                      stroke={getRiskColor(calculateSecurityScore())} 
                      strokeWidth="1.5" 
                      strokeLinecap="round"
                      style={{ 
                        filter: `drop-shadow(0 0 3px ${getRiskColor(calculateSecurityScore())}40)`,
                      }}
                    />
                    <circle cx="50" cy="55" r="3.5" fill={getRiskColor(calculateSecurityScore())} />
                    <circle cx="50" cy="55" r="1.5" fill="white" />
                  </g>
                </svg>
              </div>
              
              {/* Score Display (Positioned clearly below the arc) */}
              <div className="text-center mt-[-10px] relative z-10">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-5xl font-black tracking-tighter" style={{ 
                    color: getRiskColor(calculateSecurityScore()),
                    filter: `drop-shadow(0 0 10px ${getRiskColor(calculateSecurityScore())}20)`
                  }}>
                    {calculateSecurityScore()}
                  </span>
                  <span className="text-muted-foreground text-sm font-bold opacity-30">/100</span>
                </div>
                <p className="text-[10px] font-black tracking-[0.3em] uppercase mt-1" style={{ color: getRiskColor(calculateSecurityScore()) }}>
                  {getRiskLabel(calculateSecurityScore())}
                </p>
              </div>
            </div>

            {/* Bottom Stats Section */}
            <div className="w-full pt-8 border-t border-border/30 flex items-center justify-center gap-12 text-[13px] font-bold">
              <div className="flex items-center gap-2.5">
                <span className="text-muted-foreground/70">Safe</span>
                <span className="text-emerald-400 text-lg">{dashboardData?.safe || 0}</span>
              </div>
              <div className="w-px h-5 bg-border/60" />
              <div className="flex items-center gap-2.5">
                <span className="text-muted-foreground/70">Threats</span>
                <span className="text-red-400 text-lg">{dashboardData?.threats || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Threat Intelligence Panel */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Threat Intelligence</h3>
              <p className="text-sm text-muted-foreground">Real-time threat analysis</p>
            </div>
            <ShieldAlert className="w-5 h-5 text-red-400/70" />
          </div>
          
          <div className="space-y-4">
            {/* Recent Threat Count */}
            <div className={`p-4 rounded-lg border ${
              calculateThreatIntelligence().recentThreatCount > 2
                ? 'bg-red-500/10 border-red-500/30'
                : calculateThreatIntelligence().recentThreatCount > 0
                ? 'bg-yellow-500/10 border-yellow-500/30'
                : 'bg-emerald-500/10 border-emerald-500/30'
            }`}>
              <div className="flex items-start gap-3">
                <AlertTriangle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                  calculateThreatIntelligence().recentThreatCount > 2
                    ? 'text-red-400'
                    : calculateThreatIntelligence().recentThreatCount > 0
                    ? 'text-yellow-400'
                    : 'text-emerald-400'
                }`} />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">Recent Threats (Last 5 Scans)</p>
                  <p className={`text-3xl font-bold ${
                    calculateThreatIntelligence().recentThreatCount > 2
                      ? 'text-red-400'
                      : calculateThreatIntelligence().recentThreatCount > 0
                      ? 'text-yellow-400'
                      : 'text-emerald-400'
                  }`}>
                    {calculateThreatIntelligence().recentThreatCount}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Highest Risk Type & Trend */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
                <p className="text-xs text-muted-foreground mb-2">Highest Risk Type</p>
                <div className="flex items-center gap-2">
                  {calculateThreatIntelligence().highestRiskType === 'URL' && <Globe className="w-4 h-4 text-primary" />}
                  {calculateThreatIntelligence().highestRiskType === 'Email' && <Mail className="w-4 h-4 text-primary" />}
                  {calculateThreatIntelligence().highestRiskType === 'File' && <FileText className="w-4 h-4 text-primary" />}
                  {calculateThreatIntelligence().highestRiskType === 'Password' && <Key className="w-4 h-4 text-primary" />}
                  <p className="text-base font-semibold text-foreground">
                    {calculateThreatIntelligence().highestRiskType}
                  </p>
                </div>
              </div>
              
              <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
                <p className="text-xs text-muted-foreground mb-2">Threat Trend</p>
                <div className="flex items-center gap-2">
                  {calculateThreatIntelligence().trend === 'increasing' && (
                    <>
                      <TrendingUp className="w-4 h-4 text-red-400" />
                      <p className="text-base font-semibold text-red-400">Increasing</p>
                    </>
                  )}
                  {calculateThreatIntelligence().trend === 'decreasing' && (
                    <>
                      <TrendingDown className="w-4 h-4 text-emerald-400" />
                      <p className="text-base font-semibold text-emerald-400">Decreasing</p>
                    </>
                  )}
                  {calculateThreatIntelligence().trend === 'stable' && (
                    <>
                      <Activity className="w-4 h-4 text-yellow-400" />
                      <p className="text-base font-semibold text-yellow-400">Stable</p>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            {/* Smart Recommendation */}
            <div className={`p-4 rounded-lg border ${
              calculateThreatIntelligence().recentThreatCount > 2
                ? 'bg-red-500/10 border-red-500/30'
                : calculateThreatIntelligence().recentThreatCount > 0
                ? 'bg-yellow-500/10 border-yellow-500/30'
                : 'bg-emerald-500/10 border-emerald-500/30'
            }`}>
              <div className="flex items-start gap-3">
                <ShieldAlert className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                  calculateThreatIntelligence().recentThreatCount > 2
                    ? 'text-red-400'
                    : calculateThreatIntelligence().recentThreatCount > 0
                    ? 'text-yellow-400'
                    : 'text-emerald-400'
                }`} />
                <div className="flex-1">
                  <p className="text-xs font-semibold mb-1" style={{
                    color: calculateThreatIntelligence().recentThreatCount > 2 ? '#f87171' :
                           calculateThreatIntelligence().recentThreatCount > 0 ? '#fbbf24' : '#34d399'
                  }}>
                    Recommendation
                  </p>
                  <p className="text-sm text-foreground">
                    {calculateThreatIntelligence().recommendation}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      {generateAlerts().length > 0 && (
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Security Alerts</h3>
              <p className="text-sm text-muted-foreground">Important notifications</p>
            </div>
            <AlertCircle className="w-5 h-5 text-orange-400/70" />
          </div>
          
          <div className="space-y-3">
            {generateAlerts().map((alert, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  alert.type === 'danger'
                    ? 'bg-red-500/10 border-red-500/30'
                    : alert.type === 'warning'
                    ? 'bg-yellow-500/10 border-yellow-500/30'
                    : 'bg-blue-500/10 border-blue-500/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  {alert.type === 'danger' ? (
                    <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                  ) : alert.type === 'warning' ? (
                    <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${
                      alert.type === 'danger' ? 'text-red-400' :
                      alert.type === 'warning' ? 'text-yellow-400' : 'text-blue-400'
                    }`}>
                      {alert.message}
                    </p>
                    {alert.timestamp && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatTimestamp(alert.timestamp)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scan Trend Chart */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Scan Activity</h3>
              <p className="text-sm text-muted-foreground">Last 30 days</p>
            </div>
            <TrendingUp className="w-5 h-5 text-primary/70" />
          </div>
          
          {dashboardData?.chartData && dashboardData.chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={dashboardData.chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getMonth() + 1}/${date.getDate()}`;
                  }}
                />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(0, 0, 0, 0.85)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '12px',
                    color: '#ffffff',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
                  }}
                  itemStyle={{ color: '#ffffff' }}
                  cursor={{ stroke: 'rgba(255, 255, 255, 0.1)', strokeWidth: 1 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="total" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="safe" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={{ fill: '#10b981', r: 3 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="threat" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  dot={{ fill: '#ef4444', r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center">
              <p className="text-muted-foreground text-sm">No scan data available</p>
            </div>
          )}
        </div>

        {/* Success Rate Donut Chart */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Success Rate</h3>
              <p className="text-sm text-muted-foreground">Safe vs Threat ratio</p>
            </div>
            <CheckCircle className="w-5 h-5 text-emerald-400/70" />
          </div>
          
          {pieData.length > 0 ? (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="60%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(0, 0, 0, 0.85)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      fontSize: '12px',
                      color: '#ffffff',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
                    }}
                    itemStyle={{ color: '#ffffff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              
              <div className="flex-1 space-y-3">
                <div className="text-center mb-4">
                  <p className="text-4xl font-bold text-emerald-400">
                    {dashboardData?.successRate || 0}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Success Rate</p>
                </div>
                
                {pieData.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="text-muted-foreground">{item.name}</span>
                    </div>
                    <span className="font-semibold text-foreground">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-[250px] flex items-center justify-center">
              <p className="text-muted-foreground text-sm">No data to display</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
            <p className="text-sm text-muted-foreground">Last 5 scans</p>
          </div>
          <Activity className="w-5 h-5 text-primary/70" />
        </div>
        
        {dashboardData?.recentScans && dashboardData.recentScans.length > 0 ? (
          <div className="space-y-3">
            {dashboardData.recentScans.map((scan) => (
              <div 
                key={scan.id}
                className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border/50 hover:border-primary/30 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    {getScanTypeIcon(scan.type)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground capitalize">
                      {scan.type} Scan
                    </p>
                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                      {scan.target}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">
                    {formatTimestamp(scan.timestamp)}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(scan.status)}`}>
                    {scan.status.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Activity className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No scans yet</p>
            <p className="text-xs text-muted-foreground mt-1">Perform your first scan to see activity</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => navigate('/scanning?type=url')}
            className="flex flex-col items-center gap-2 p-4 bg-muted/30 rounded-lg border border-border/50 hover:border-primary/50 hover:bg-primary/10 transition-all group"
          >
            <Globe className="w-6 h-6 text-primary/70 group-hover:text-primary transition-colors" />
            <span className="text-sm font-medium text-foreground">Scan URL</span>
          </button>
          
          <button
            onClick={() => navigate('/scanning?type=email')}
            className="flex flex-col items-center gap-2 p-4 bg-muted/30 rounded-lg border border-border/50 hover:border-primary/50 hover:bg-primary/10 transition-all group"
          >
            <Mail className="w-6 h-6 text-primary/70 group-hover:text-primary transition-colors" />
            <span className="text-sm font-medium text-foreground">Email Check</span>
          </button>
          
          <button
            onClick={() => navigate('/scanning?type=file')}
            className="flex flex-col items-center gap-2 p-4 bg-muted/30 rounded-lg border border-border/50 hover:border-primary/50 hover:bg-primary/10 transition-all group"
          >
            <FileText className="w-6 h-6 text-primary/70 group-hover:text-primary transition-colors" />
            <span className="text-sm font-medium text-foreground">File Analysis</span>
          </button>
          
          <button
            onClick={() => navigate('/scanning?type=password')}
            className="flex flex-col items-center gap-2 p-4 bg-muted/30 rounded-lg border border-border/50 hover:border-primary/50 hover:bg-primary/10 transition-all group"
          >
            <Key className="w-6 h-6 text-primary/70 group-hover:text-primary transition-colors" />
            <span className="text-sm font-medium text-foreground">Password Check</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileDashboard;
