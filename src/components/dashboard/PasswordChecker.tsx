import { useState } from "react";
import { Lock, Loader2, Eye, EyeOff, RotateCcw, AlertCircle, CheckCircle2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { apiScans } from "@/lib/api";

// --- INDUSTRY STANDARD STRENGTH LOGIC ---
const calculateStrength = (password: string) => {
  let score = 0;
  let suggestions = [];

  if (password.length >= 8) score += 20; else suggestions.push("Min 8 characters");
  if (password.length >= 12) score += 10;
  if (/[A-Z]/.test(password)) score += 20; else suggestions.push("Add uppercase (A-Z)");
  if (/[a-z]/.test(password)) score += 15; else suggestions.push("Add lowercase (a-z)");
  if (/[0-9]/.test(password)) score += 15; else suggestions.push("Add numbers (0-9)");
  if (/[^A-Za-z0-9]/.test(password)) score += 20; else suggestions.push("Add symbols (!@#$)");

  let strength: "weak" | "medium" | "strong" = "weak";
  if (score >= 80) strength = "strong";
  else if (score >= 50) strength = "medium";

  return { score: Math.min(score, 100), strength, suggestions };
};

const checkPwnedApi = async (password: string): Promise<number> => {
  try {
    const utf8 = new TextEncoder().encode(password);
    if (!window.crypto || !window.crypto.subtle) throw new Error("SECURE_CONTEXT_REQUIRED");

    const hashBuffer = await crypto.subtle.digest('SHA-1', utf8);
    const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();

    const prefix = hashHex.slice(0, 5);
    const suffix = hashHex.slice(5);
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
    if (!response.ok) return 0;

    const text = await response.text();
    const found = text.split('\n').find(line => line.startsWith(suffix));
    return found ? parseInt(found.split(':')[1]) : 0;
  } catch (err) {
    throw err;
  }
};

const PasswordChecker = ({ onScanComplete, isAuthenticated = false, scanData, setScanData }: any) => {
  const [password, setPassword] = useState(scanData.input || "");
  const [show, setShow] = useState(false);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<any>(scanData.result || null);

  const handleReset = () => {
    setPassword("");
    setResult(null);
    setScanData({ input: "", result: null });
  };

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) { toast.error("Enter a password to check"); return; }
    
    setChecking(true);
    try {
      const leakCount = await checkPwnedApi(password);
      const res = calculateStrength(password);
      const finalResult = { ...res, breached: leakCount > 0, leakCount };

      setResult(finalResult);
      setScanData({ input: password, result: finalResult });
      onScanComplete();
      
      if (isAuthenticated) {
        await apiScans.saveScan({
          type: "password",
          target: "Password Audit",
          status: finalResult.breached ? "breached" : "safe"
        });
      }
    } catch (err) {
      toast.error("Security check failed. Please use Localhost or HTTPS.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <section className="bg-card border border-border rounded-lg p-6 animate-fade-in-up">
      <h2 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
        <Lock className="w-5 h-5 text-primary" /> Password Checker
      </h2>
      
      {/* RESTORED ORIGINAL LOGIN MESSAGE */}
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
            className="pr-10 bg-muted border-border"
          />
          <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50">
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={checking}>
            {checking ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Check Password"}
          </Button>
          {(password || result) && (
            <Button type="button" onClick={handleReset} variant="outline" disabled={checking}>
              <RotateCcw className="w-4 h-4" />
            </Button>
          )}
        </div>
      </form>

      {result && (
        <div className="mt-6 space-y-4 animate-in fade-in zoom-in-95">
          
          {/* UPDATED STATUS BOXES: REMOVED "PWNED" */}
          {result.breached ? (
            <div className="bg-[#1a050a] border border-destructive/50 rounded-lg p-6 text-center">
               <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-2 animate-pulse" />
               <h3 className="text-xl font-bold text-destructive uppercase">Breached</h3>
               <p className="text-muted-foreground text-sm mt-1">
                 This password has been found in <span className="text-destructive font-bold">{result.leakCount.toLocaleString()}</span> known data breaches.
               </p>
               <p className="text-muted-foreground text-[10px] mt-2 italic">
                 It is highly recommended to change this password immediately.
               </p>
            </div>
          ) : (
            <div className="bg-[#051a0d] border border-primary/50 rounded-lg p-6 text-center">
               <CheckCircle2 className="w-10 h-10 text-primary mx-auto mb-2" />
               <h3 className="text-xl font-bold text-primary uppercase">Safe</h3>
               <p className="text-muted-foreground text-sm mt-1">Great news! This password was not found in any public leaks.</p>
            </div>
          )}

          {/* STRENGTH ANALYSIS SECTION */}
          <div className="p-5 rounded-lg border border-border bg-card/50 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                <h3 className="font-heading font-semibold text-sm">Strength Analysis</h3>
              </div>
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                result.strength === "strong" ? "bg-primary/20 text-primary" :
                result.strength === "medium" ? "bg-yellow-500/20 text-yellow-500" :
                "bg-destructive/20 text-destructive"
              }`}>
                {result.strength.toUpperCase()}
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                <span>Score</span>
                <span>{result.score}/100</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-700 ${
                    result.strength === "strong" ? "bg-primary" : 
                    result.strength === "medium" ? "bg-yellow-500" : "bg-destructive"
                  }`}
                  style={{ width: `${result.score}%` }}
                />
              </div>
            </div>

            {result.suggestions.length > 0 && (
              <div className="pt-2 flex flex-wrap gap-2">
                {result.suggestions.map((s: string, i: number) => (
                  <span key={i} className="text-[10px] text-muted-foreground border border-border px-2 py-0.5 rounded bg-muted/30">
                    • {s}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default PasswordChecker;