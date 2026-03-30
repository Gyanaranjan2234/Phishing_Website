import { useState } from "react";
import { Lock, Loader2, Eye, EyeOff, RotateCcw, AlertCircle, CheckCircle2, Shield, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { analyzePassword, type PasswordResult } from "@/lib/mockData";
import { downloadReport, type PDFReportData } from "@/lib/pdfReportGenerator";
import { apiScans } from "@/lib/api";

interface PasswordCheckerProps {
  onScanComplete: () => void;
  isAuthenticated?: boolean;
  userName?: string;
  scanData: { input: string; result: any };
  setScanData: (data: { input: string; result: any }) => void;
}

const PasswordChecker = ({ onScanComplete, isAuthenticated = false, userName, scanData, setScanData }: PasswordCheckerProps) => {
  const [password, setPassword] = useState(scanData.input || "");
  const [show, setShow] = useState(false);
  const [checking, setChecking] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [result, setResult] = useState<PasswordResult | null>(scanData.result || null);

  const handleReset = () => {
    setPassword("");
    setResult(null);
    setScanData({ input: "", result: null });
    toast.success("Password check cleared");
  };

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) { toast.error("Enter a password to check"); return; }
    setChecking(true);
    setResult(null);
    setTimeout(async () => {
      const res = analyzePassword(password);
      setResult(res);
      setScanData({ input: password, result: res });
      setChecking(false);
      onScanComplete();
      
      // Save to history if authenticated
      if (isAuthenticated) {
        try {
          await apiScans.saveScan({
            type: "password",
            target: "password",
            status: res.breached ? "breached" : res.strength === "strong" ? "safe" : "weak"
          });
          toast.success("✅ Result saved to history");
        } catch (err) {
          console.error("Failed to save scan:", err);
        }
      } else {
        toast.info("📝 Guest scan (not saved - login to save history)");
      }
    }, 1500);
  };

  const getStrengthColor = (strength: string) => {
    return strength === "strong" ? "text-primary" : strength === "medium" ? "text-accent" : "text-destructive";
  };

  const getProgressColor = (strength: string) => {
    return strength === "strong" ? "bg-primary" : strength === "medium" ? "bg-accent" : "bg-destructive";
  };

  const handleGenerateReport = async () => {
    // Use local result, fallback to scanData result from parent
    const reportResult = result || scanData.result;
    if (!reportResult) {
      toast.error("No scan result available. Please check a password first.");
      return;
    }
    
    setDownloading(true);
    try {
      const reportData: PDFReportData = {
        scanType: "password",
        target: "Password Analysis",
        result: reportResult,
        userName: userName
      };

      downloadReport(reportData);
      toast.success("✅ Report Downloaded", {
        description: "Password security report has been saved to your device"
      });
    } catch (error) {
      toast.error("❌ Error", {
        description: "Failed to generate report"
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <section className="bg-card border border-border rounded-lg p-6 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
      <h2 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
        <Lock className="w-5 h-5 text-primary" /> Password Checker
      </h2>
      {!isAuthenticated && (
        <div className="mb-4 rounded-lg border border-border/40 bg-primary/10 p-3 text-sm text-primary">
          Login to save your scan history when signed in.
        </div>
      )}
      <form onSubmit={handleCheck} className="flex gap-3 flex-col sm:flex-row">
        <div className="relative flex-1">
          <Input
            type={show ? "text" : "password"}
            placeholder="Enter password to check"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pr-10 bg-muted border-border text-foreground placeholder:text-muted-foreground focus:shadow-[0_0_12px_hsl(150_100%_45%/0.2)]"
          />
          <button
            type="button"
            onClick={() => setShow(!show)}
            className={`absolute right-3 top-1/2 -translate-y-1/2 transition-all duration-200 ${
              password.length > 0 
                ? 'text-muted-foreground hover:text-primary opacity-100 cursor-pointer' 
                : 'text-muted-foreground opacity-0 pointer-events-none'
            }`}
            title={show ? "Hide password" : "Show password"}
            aria-label={show ? "Hide password" : "Show password"}
            disabled={password.length === 0}
          >
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={checking} className="font-heading shrink-0 hover:shadow-[0_0_16px_hsl(150_100%_45%/0.3)] transition-shadow">
            {checking ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Checking...</> : "Check Password"}
          </Button>
          {(password || result) && (
            <Button type="button" onClick={handleReset} variant="outline" disabled={checking} className="font-heading shrink-0 border-border hover:bg-card/70 transition gap-2">
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Reset</span>
            </Button>
          )}
        </div>
      </form>

      {result && (
        <div className="mt-6 space-y-4">
          {/* Breach Status Alert */}
          {result.breached ? (
            <div className="relative overflow-hidden rounded-lg border-2 border-destructive/50 bg-destructive/10 p-5 space-y-3 shadow-lg shadow-destructive/20">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-5 bg-gradient-to-br from-destructive via-transparent pointer-events-none rounded-lg"></div>
              
              {/* Content */}
              <div className="relative z-10 space-y-3">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-destructive mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-heading font-bold text-destructive text-lg">⚠️ Warning — Password Compromised</h3>
                    <p className="text-sm text-destructive/90 mt-1">
                      This password has been found in previous data breaches and is unsafe to use.
                    </p>
                  </div>
                </div>
                
                <div className="ml-9 space-y-2 rounded-lg bg-destructive/5 p-3 border border-destructive/20">
                  <p className="text-xs font-semibold text-destructive uppercase">Breach Details</p>
                  <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                    <div>
                      <p className="text-xs uppercase text-destructive/70">Status</p>
                      <p className="font-mono font-semibold text-destructive">Compromised</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-destructive/70">Known Uses</p>
                      <p className="font-mono font-semibold text-destructive">Multiple</p>
                    </div>
                  </div>
                </div>

                <div className="ml-9 text-xs text-muted-foreground space-y-1 pt-2">
                  <p><span className="font-semibold text-destructive">Recommendation:</span> Change this password immediately on all accounts that use it.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-lg border-2 border-primary/40 bg-primary/5 p-5 space-y-3 shadow-lg shadow-primary/10">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-5 bg-gradient-to-br from-primary via-transparent pointer-events-none rounded-lg"></div>
              
              {/* Content */}
              <div className="relative z-10 flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-primary mt-0.5 shrink-0" />
                <div className="flex-1">
                  <h3 className="font-heading font-bold text-primary text-lg">✓ Safe — No Breach Found</h3>
                  <p className="text-sm text-primary/80 mt-1">
                    This password is not found in known data breaches.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Strength Analysis Section */}
          <div className="p-5 rounded-lg border border-border bg-card/50 backdrop-blur-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                <h3 className="font-heading font-semibold text-foreground">Strength Analysis</h3>
              </div>
              <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                result.strength === "strong" ? "bg-primary/20 text-primary" :
                result.strength === "medium" ? "bg-accent/20 text-accent" :
                "bg-destructive/20 text-destructive"
              }`}>
                {result.strength.charAt(0).toUpperCase() + result.strength.slice(1)}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground font-medium">Strength Score</p>
                <p className="text-xs font-mono font-bold text-foreground">{result.score}/100</p>
              </div>
              <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${getProgressColor(result.strength)} rounded-full`}
                  style={{ width: `${Math.min(result.score, 100)}%` }}
                />
              </div>
            </div>

            {/* Status Message */}
            <p className="text-sm text-muted-foreground">
              {result.strength === "weak" 
                ? "❌ Password is weak. Add more complexity to improve security."
                : result.strength === "medium"
                ? "⚠️ Password is moderate. Consider adding more variety."
                : "✅ Password is strong. Good security level."}
            </p>
          </div>

          {/* Improvement Suggestions */}
          {result.suggestions.length > 0 && (
            <div className="p-4 rounded-lg border border-accent/30 bg-accent/5 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-accent rounded-full"></div>
                <p className="font-heading font-semibold text-accent text-sm">Improvement Tips</p>
              </div>
              <ul className="space-y-2 ml-2">
                {result.suggestions.map((s, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-accent font-bold mt-0.5">•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Download Report Button */}
          <div className="flex gap-2">
            <Button 
              onClick={handleGenerateReport} 
              disabled={downloading}
              className="flex-1 gap-2 hover:shadow-[0_0_16px_hsl(150_100%_45%/0.3)] transition-shadow"
            >
              {downloading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
              ) : (
                <><Download className="w-4 h-4" /> Download Report</>
              )}
            </Button>
          </div>
        </div>
      )}
    </section>
  );
};

export default PasswordChecker;
