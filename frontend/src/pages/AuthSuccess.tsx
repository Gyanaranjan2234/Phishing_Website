import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";

const AuthSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleAuthSuccess = () => {
      // Get token from URL query parameters
      const params = new URLSearchParams(location.search);
      const token = params.get("token");

      if (!token) {
        console.error("❌ No token found in URL");
        navigate("/login?error=no_token");
        return;
      }

      console.log("✅ Token received from Google OAuth");
      console.log("🔑 Token:", token.substring(0, 30) + "...");

      // Save token to localStorage
      localStorage.setItem("auth_token", token);
      localStorage.setItem("token", token); // Also save as "token" for compatibility

      // Decode JWT token to get user info
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        console.log("👤 User info from token:", payload);

        // Store user info in localStorage for easy access
        localStorage.setItem("user_session", JSON.stringify({
          id: payload.user_id,
          email: payload.email,
          username: payload.username,
        }));
        localStorage.setItem("username", payload.username);
        localStorage.setItem("user_id", payload.user_id.toString());

        console.log("✅ Token and user info saved to localStorage");
      } catch (error) {
        console.error("❌ Failed to decode token:", error);
        navigate("/login?error=invalid_token");
        return;
      }

      // Redirect to home page
      console.log("🚀 Redirecting to home page...");
      navigate("/", { replace: true });
    };

    handleAuthSuccess();
  }, [location, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Completing Login...</h2>
        <p className="text-slate-400">Saving your session and redirecting</p>
      </div>
    </div>
  );
};

export default AuthSuccess;
