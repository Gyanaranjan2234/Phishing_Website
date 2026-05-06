import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { apiAuth } from "@/lib/api-backend";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const token = searchParams.get("token");

        if (!token) {
          setStatus("error");
          setMessage("No verification token provided");
          return;
        }

        // Call verify endpoint
        const response = await apiAuth.verifyEmail(token);

        if (response.status === "success") {
          setStatus("success");
          setMessage(response.message || "Email verified successfully!");
          toast.success("Email verified! You can now login.");
          // Redirect to login after 3 seconds
          setTimeout(() => navigate("/login"), 3000);
        } else {
          setStatus("error");
          setMessage(response.message || "Email verification failed");
          toast.error(response.message || "Verification failed");
        }
      } catch (error: any) {
        setStatus("error");
        setMessage(error.message || "An error occurred during verification");
        toast.error("Verification error");
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center cyber-grid px-4 relative">
      <Button
        onClick={() => navigate("/")}
        variant="ghost"
        className="absolute top-4 left-4 flex items-center gap-2 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Button>

      <div className="w-full max-w-md animate-fade-in-up">
        <div className="flex flex-col items-center gap-2 mb-8">
          <img src="/apgs-logo.png" alt="APGS Logo" className="h-10 w-auto" />
          <h1 className="text-3xl font-heading font-bold text-primary">APGS</h1>
          <p className="text-muted-foreground text-sm">Advanced Phishing Guard System</p>
        </div>

        <div className="bg-card border border-border rounded-lg p-8 text-center">
          {status === "loading" && (
            <>
              <Loader2 className="w-16 h-16 text-primary mx-auto mb-4 animate-spin" />
              <h2 className="text-xl font-heading font-semibold text-foreground mb-2">
                Verifying Email...
              </h2>
              <p className="text-muted-foreground text-sm">Please wait while we verify your email address</p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-heading font-semibold text-foreground mb-2">
                Email Verified!
              </h2>
              <p className="text-muted-foreground text-sm mb-6">
                {message}
              </p>
              <p className="text-xs text-muted-foreground mb-4">Redirecting to login...</p>
              <Button
                onClick={() => navigate("/login")}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-heading font-semibold"
              >
                Go to Login
              </Button>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-heading font-semibold text-foreground mb-2">
                Verification Failed
              </h2>
              <p className="text-muted-foreground text-sm mb-6">
                {message}
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={() => navigate("/")}
                  variant="outline"
                  className="flex-1"
                >
                  Home
                </Button>
                <Button
                  onClick={() => navigate("/login")}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Back to Login
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
