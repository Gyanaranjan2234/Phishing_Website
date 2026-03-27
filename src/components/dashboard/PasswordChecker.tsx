import { useState } from "react";
import { Lock, Loader2, Eye, EyeOff, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { analyzePassword, type PasswordResult } from "@/lib/mockData";
import { apiScans } from "@/lib/api";
import RiskAnalysisReport from "@/components/RiskAnalysisReport";

interface PasswordCheckerProps {
  onScanComplete: () => void;
  isAuthenticated?: boolean;
  userName?: string;
  scanData: { input: string; result: any };
  setScanData: (data: { input: string; result: any }) => void;
}

const PasswordChecker = ({ onScanComplete, isAuthenticated = false, userName, scanData, setScanData }: PasswordCheckerProps) => {
  const [password, setPassword] = useState(scanData.input);
  const [show, setShow] = useState(false);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<PasswordResult | null>(scanData.result);

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
            status: res.strength === "strong" ? "safe" : res.strength === "medium" ? "safe" : "breached"
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

  const strengthColor = result?.strength === "strong" ? "text-primary" : result?.strength === "medium" ? "text-accent" : "text-destructive";
  const progressColor = result?.strength === "strong" ? "[&>div]:bg-primary" : result?.strength === "medium" ? "[&>div]:bg-accent" : "[&>div]:bg-destructive";

  return (
    <section className="bg-card border border-border rounded-lg p-6 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
      <h2 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
        <Lock className="w-5 h-5 text-primary" /> Password Leak Checker
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
          <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
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
          <RiskAnalysisReport
            data={{
              scanType: "password",
              status: result.strength === "strong" ? "safe" : result.strength === "medium" ? "suspicious" : "dangerous",
              score: result.score,
              details: result.breached 
                ? "Password found in known breaches"
                : "Password appears to be secure",
              threats: result.breached ? ["Found in data breach"] : [],
              timestamp: new Date().toISOString(),
              userName: userName,
              targetItem: "Password"
            }}
          />

          {/* Additional Password Suggestions */}
          {result.suggestions.length > 0 && (
            <div className="mt-4 p-4 rounded-lg border border-primary/30 bg-primary/5">
              <p className="font-heading font-semibold text-primary text-sm mb-2">Improvement Suggestions:</p>
              <ul className="space-y-1">
                {result.suggestions.map((s, i) => (
                  <li key={i} className="text-muted-foreground text-sm">• {s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default PasswordChecker;
