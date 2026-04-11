import { useState } from "react";
import { Lock, Loader2, Eye, EyeOff, RotateCcw, AlertCircle, CheckCircle2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { analyzePassword, type PasswordResult } from "@/lib/mockData";
import { apiScans } from "@/lib/api";

interface PasswordCheckerProps {
  onScanComplete: () => void;
  isAuthenticated?: boolean;
  userName?: string;
  scanData: { input: string; result: any };
  setScanData: (data: { input: string; result: any }) => void;
}

// SHA-1 Hashing utility for k-Anonymity check
// Updated utility to handle both Secure (HTTPS) and Non-Secure (HTTP) contexts
const checkPwnedApi = async (password: string): Promise<number> => {
  try {
    let hashHex = "";

    // Try using the high-performance Web Crypto API (requires HTTPS/Localhost)
    if (window.crypto && window.crypto.subtle) {
      const msgUint8 = new TextEncoder().encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-1', msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    } else {
      // FALLBACK: If subtle is undefined (Non-Secure Context), 
      // we'll use a basic manual SHA-1 implementation or a library logic.
      // For a quick fix without adding libraries, let's alert the user or use a simple logic:
      console.warn("Crypto Subtle not available. Ensure you are using HTTPS.");
      
      // If you're in dev, you can use a library like 'js-sha1' 
      // or simply notify the user that security features require HTTPS.
      throw new Error("Secure Context Required");
    }

    const prefix = hashHex.slice(0, 5);
    const suffix = hashHex.slice(5);

    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
    console.log(response);
    if (!response.ok) return 0;

    const text = await response.text();
    const lines = text.split('\n');
    const found = lines.find(line => line.startsWith(suffix));
    
    return found ? parseInt(found.split(':')[1]) : 0;
  } catch (err) {
    console.error("Breach check failed:", err);
    // If it fails because of HTTPS, we should let the UI know
    return 0;
  }
};
const PasswordChecker = ({ onScanComplete, isAuthenticated = false, scanData, setScanData }: PasswordCheckerProps) => {
  const [password, setPassword] = useState(scanData.input || "");
  const [show, setShow] = useState(false);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<PasswordResult | null>(scanData.result || null);

  const handleReset = () => {
    setPassword("");
    setResult(null);
    setScanData({ input: "", result: null });
    toast.success("Password check cleared");
  };

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) { toast.error("Enter a password to check"); return; }
    
    setChecking(true);
    setResult(null);

    try {
      // 1. Check real breach database
      const leakCount = await checkPwnedApi(password);
      
      // 2. Local strength analysis
      const res = analyzePassword(password);
      
      // 3. Combine results
      const finalResult = { 
        ...res, 
        breached: leakCount > 0,
        leakCount: leakCount 
      };

      setResult(finalResult);
      console.log(finalResult);
      setScanData({ input: password, result: finalResult });
      onScanComplete();
      
      if (isAuthenticated) {
        try {
          await apiScans.saveScan({
            type: "password",
            target: "password",
            status: finalResult.breached ? "breached" : finalResult.strength === "strong" ? "safe" : "weak"
          });
          toast.success("✅ Result saved to history");
        } catch (err) {
          console.error("Failed to save scan:", err);
        }
      } else {
        toast.info("📝 Guest scan (not saved)");
      }
    } catch (err) {
      toast.error("Error connecting to security database");
    } finally {
      setChecking(false);
    }
  };

  const getProgressColor = (strength: string) => {
    return strength === "strong" ? "bg-primary" : strength === "medium" ? "bg-accent" : "bg-destructive";
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
          >
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={checking} className="font-heading shrink-0 hover:shadow-[0_0_16px_hsl(150_100%_45%/0.3)] transition-shadow">
            {checking ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</> : "Check Password"}
          </Button>
          {(password || result) && (
            <Button type="button" onClick={handleReset} variant="outline" disabled={checking} className="font-heading shrink-0 border-border hover:bg-card/70 gap-2">
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Reset</span>
            </Button>
          )}
        </div>
      </form>

      {result && (
        <div className="mt-6 space-y-4 animate-in fade-in zoom-in-95 duration-500">
          
          {/* BREACH STATUS CARD (YES/NO) */}
          {result.breached ? (
            <div className="relative overflow-hidden rounded-xl border-2 border-destructive bg-destructive/5 p-6 text-center shadow-lg shadow-destructive/10">
              <div className="flex flex-col items-center gap-3">
                <div className="p-3 bg-destructive/20 rounded-full">
                  <AlertCircle className="w-10 h-10 text-destructive animate-pulse" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-destructive">YES — LEAKED</h3>
                  <p className="text-muted-foreground max-w-xs mx-auto mt-2">
                    This password was found in public data breaches. It is <span className="text-destructive font-bold uppercase">Unsafe</span> to use.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-xl border-2 border-primary bg-primary/5 p-6 text-center shadow-lg shadow-primary/10">
              <div className="flex flex-col items-center gap-3">
                <div className="p-3 bg-primary/20 rounded-full">
                  <CheckCircle2 className="w-10 h-10 text-primary" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-primary">NO — NOT LEAKED</h3>
                  <p className="text-muted-foreground max-w-xs mx-auto mt-2">
                    Great news! This password was <span className="text-primary font-bold uppercase">not found</span> in any known database leaks.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STRENGTH ANALYSIS SECTION */}
          <div className="p-5 rounded-lg border border-border bg-card/50 backdrop-blur-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                <h3 className="font-heading font-semibold text-foreground">Security Strength</h3>
              </div>
              <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                result.strength === "strong" ? "bg-primary/20 text-primary" :
                result.strength === "medium" ? "bg-accent/20 text-accent" :
                "bg-destructive/20 text-destructive"
              }`}>
                {result.strength.toUpperCase()}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground font-medium">Strength Score</p>
                <p className="text-xs font-mono font-bold text-foreground">{result.score}/100</p>
              </div>
              <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${getProgressColor(result.strength)} rounded-full`}
                  style={{ width: `${Math.min(result.score, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* IMPROVEMENT TIPS */}
          {result.suggestions.length > 0 && (
            <div className="p-4 rounded-lg border border-accent/30 bg-accent/5 space-y-2">
              <p className="font-heading font-semibold text-accent text-sm flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                Security Recommendations
              </p>
              <ul className="space-y-1.5 ml-3">
                {result.suggestions.map((s, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                    <span className="text-accent font-bold">•</span>
                    <span>{s}</span>
                  </li>
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