import { useQuery } from "@tanstack/react-query";
import { apiScans, apiAuth } from "@/lib/api/api-backend";
import { useState, useEffect, useMemo } from "react";

export const useDashboardStats = () => {
  const [userId, setUserId] = useState<number | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { session } = await apiAuth.getSession();
        if (session?.user) {
          setIsAuthenticated(true);
          setUserId(Number(session.user.id));
          setUserName(session.user.username || session.user.email || "");
          setUserEmail(session.user.email || "");
        } else {
          const savedId = localStorage.getItem("user_id");
          if (savedId) {
            setUserId(Number(savedId));
            setIsAuthenticated(true);
            setUserName(localStorage.getItem("username") || "");
          } else {
            setIsAuthenticated(false);
            setUserId(null);
          }
        }
      } catch (error) {
        console.error("Hook auth check error:", error);
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  const { data: dashboardData, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboard', userId],
    queryFn: async () => {
      if (!userId) return null;
      const res = await apiScans.getDashboardData(userId);
      return res.status === 'success' ? res.data : null;
    },
    enabled: !!userId,
    staleTime: 30000, // 30 seconds
  });

  const stats = useMemo(() => {
    if (!dashboardData) return null;
    return {
      totalScans: dashboardData.totalScans || 0,
      safe: dashboardData.safe || 0,
      threats: dashboardData.threats || 0,
      suspicious: dashboardData.suspicious || 0,
      detectionRate: dashboardData.totalScans > 0 
        ? Math.round(((dashboardData.threats || 0) / dashboardData.totalScans) * 100) 
        : 0,
      lastScan: dashboardData.lastScan ? new Date(dashboardData.lastScan) : null,
      chartData: dashboardData.chartData || []
    };
  }, [dashboardData]);

  const history = useMemo(() => {
    if (!dashboardData?.recentScans) return [];
    return dashboardData.recentScans.map((scan: any) => ({
      id: scan.id.toString(),
      type: (scan.scan_type || scan.type || "url") as "url" | "file" | "email" | "password",
      target: scan.target || "",
      status: (scan.status || "safe") as string,
      timestamp: scan.timestamp ? new Date(scan.timestamp) : new Date()
    }));
  }, [dashboardData]);

  return {
    stats,
    history,
    dashboardData,
    isLoading,
    isError,
    refetch,
    userId,
    userName,
    userEmail,
    isAuthenticated
  };
};
