import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  Globe, 
  Mail, 
  FileText, 
  Key,
  ExternalLink,
  Activity
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
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                  }}
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
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
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
            onClick={() => navigate('/scanning')}
            className="flex flex-col items-center gap-2 p-4 bg-muted/30 rounded-lg border border-border/50 hover:border-primary/50 hover:bg-primary/10 transition-all group"
          >
            <Globe className="w-6 h-6 text-primary/70 group-hover:text-primary transition-colors" />
            <span className="text-sm font-medium text-foreground">Scan URL</span>
          </button>
          
          <button
            onClick={() => navigate('/scanning')}
            className="flex flex-col items-center gap-2 p-4 bg-muted/30 rounded-lg border border-border/50 hover:border-primary/50 hover:bg-primary/10 transition-all group"
          >
            <Mail className="w-6 h-6 text-primary/70 group-hover:text-primary transition-colors" />
            <span className="text-sm font-medium text-foreground">Email Check</span>
          </button>
          
          <button
            onClick={() => navigate('/scanning')}
            className="flex flex-col items-center gap-2 p-4 bg-muted/30 rounded-lg border border-border/50 hover:border-primary/50 hover:bg-primary/10 transition-all group"
          >
            <FileText className="w-6 h-6 text-primary/70 group-hover:text-primary transition-colors" />
            <span className="text-sm font-medium text-foreground">File Analysis</span>
          </button>
          
          <button
            onClick={() => navigate('/scanning')}
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
