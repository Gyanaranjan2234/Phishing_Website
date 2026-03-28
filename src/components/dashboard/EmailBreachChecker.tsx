import { useState } from "react";
import { Mail, Loader2, ShieldCheck, ShieldAlert, RotateCcw, AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { checkEmailBreach, type BreachResult } from "@/lib/mockData";
import { apiScans } from "@/lib/api";

interface EmailBreachCheckerProps {
  onScanComplete: () => void;
  isAuthenticated?: boolean;
  userName?: string;
  scanData: { input: string; result: any };
  setScanData: (data: { input: string; result: any }) => void;
}

const EmailBreachChecker = ({ onScanComplete, isAuthenticated = false, userName, scanData, setScanData }: EmailBreachCheckerProps) => {
  const [email, setEmail] = useState(scanData.input);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<BreachResult | null>(scanData.result);

  const handleReset = () => {
    setEmail("");
    setResult(null);
    setScanData({ input: "", result: null });
    toast.success("Email scan cleared");
  };

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { toast.error("Enter an email address"); return; }
    setChecking(true);
    setResult(null);
    setTimeout(async () => {
      const res = checkEmailBreach(email);
      setResult(res);
      setScanData({ input: email, result: res });
      setChecking(false);
      onScanComplete();
      
      // Save to history if authenticated
      if (isAuthenticated) {
        try {
          await apiScans.saveScan({
            type: "email",
            target: email,
            status: res.breached ? "breached" : "safe"
          });
          toast.success("✅ Result saved to history");
        } catch (err) {
          console.error("Failed to save scan:", err);
        }
      } else {
        toast.info("📝 Guest scan (not saved - login to save history)");
      }
      
      if (res.breached) toast.error("⚠️ Email found in data breaches!");
      else toast.success("✅ No breaches found");
    }, 1800);
  };

  return (
    <section className="bg-card border border-border rounded-lg p-6 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
      <h2 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
        <Mail className="w-5 h-5 text-primary" /> Email Breach Checker
      </h2>
      {!isAuthenticated && (
        <div className="mb-4 rounded-lg border border-border/40 bg-primary/10 p-3 text-sm text-primary">
          Login to save your scan history when signed in.
        </div>
      )}
      <form onSubmit={handleCheck} className="flex gap-3 flex-col sm:flex-row">
        <Input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 bg-muted border-border text-foreground placeholder:text-muted-foreground focus:shadow-[0_0_12px_hsl(150_100%_45%/0.2)]"
        />
        <div className="flex gap-2">
          <Button type="submit" disabled={checking} className="font-heading shrink-0 hover:shadow-[0_0_16px_hsl(150_100%_45%/0.3)] transition-shadow">
            {checking ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Checking...</> : "Check Breach"}
          </Button>
          {(email || result) && (
            <Button type="button" onClick={handleReset} variant="outline" disabled={checking} className="font-heading shrink-0 border-border hover:bg-card/70 transition gap-2">
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Reset</span>
            </Button>
          )}
        </div>
      </form>

      {result && (
        <div className="mt-6 space-y-4">
          {/* Direct Results Display - No Report */}
          <div className="p-4 rounded-lg border border-border bg-card/75">
            <div className="flex items-start gap-3">
              {result.breached ? (
                <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
              ) : (
                <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">
                  {result.breached ? "Email Found in Breaches" : "Email Not Breached"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {result.breached 
                    ? `This email was found in ${result.count} breach${result.count > 1 ? "es" : ""}`
                    : "This email has not been found in known data breaches"}
                </p>
              </div>
            </div>
          </div>

          {/* Additional Breach Details */}
          {result.breached && result.sources.length > 0 && (
            <div className="mt-4 p-4 rounded-lg border border-destructive/30 bg-destructive/5">
              <p className="font-heading font-semibold text-destructive text-sm mb-2">Compromised Sources:</p>
              <ul className="space-y-1">
                {result.sources.map((s, i) => (
                  <li key={i} className="text-muted-foreground text-sm font-mono">• {s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default EmailBreachChecker;
