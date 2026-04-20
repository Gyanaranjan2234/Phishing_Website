import { useState } from "react";
import { Mail, Loader2, RotateCcw, AlertTriangle, CheckCircle, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { apiScans } from "@/lib/api-backend";  // UPDATED: Use backend API
import { handleScanAttempt } from "@/lib/guestAccess";  // ADDED: Guest access control

interface EmailBreachCheckerProps {
  onScanComplete: () => void;
  isAuthenticated?: boolean;
  userName?: string;
  scanData: { input: string; result: any };
  setScanData: (data: { input: string; result: any }) => void;
}

const EmailBreachChecker = ({ onScanComplete, isAuthenticated = false, scanData, setScanData }: EmailBreachCheckerProps) => {
  const [email, setEmail] = useState(scanData.input || "");
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<any | null>(scanData.result || null);

  const handleReset = () => {
    setEmail("");
    setResult(null);
    setScanData({ input: "", result: null });
    toast.success("Email scan cleared");
  };

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { toast.error("Enter an email address"); return; }
    
    // GUEST ACCESS CHECK: Verify scan limit before proceeding
    const scanAccess = handleScanAttempt();
    if (!scanAccess.success) {
      // Guest limit reached - block scan and show message
      toast.error(scanAccess.message);
      return;
    }

    // Show guest scan info (only for guests)
    if (!isAuthenticated) {
      toast.info(`📝 ${scanAccess.message}`);
    }

    setChecking(true);
    setResult(null);

    try {
      // 1. Call XposedOrNot API
      const response = await fetch(`https://api.xposedornot.com/v1/check-email/${email.trim()}`);
      const data = await response.json();

      // XposedOrNot returns 404 or an empty response if no breaches found
      // Based on your JSON: { "breaches": [ ["Source"] ], "status": "success" }
      const isBreached = data && data.breaches && data.breaches.length > 0;
      
      const finalResult = {
        breached: isBreached,
        sources: isBreached ? data.breaches.flat() : [],
        count: isBreached ? data.breaches.length : 0,
        email: email
      };

      setResult(finalResult);
      setScanData({ input: email, result: finalResult });
      onScanComplete();

      // 2. Save to history if authenticated
      if (isAuthenticated) {
        try {
          // Get user_id from localStorage for secure data isolation
          const userId = localStorage.getItem('user_id');
          console.log('💾 Saving email scan - user_id:', userId, 'email:', email, 'status:', isBreached ? "breached" : "safe");
          
          if (userId) {
            const saveResult = await apiScans.saveScan(
              parseInt(userId),  // Use user_id (NOT username)
              "email",
              email,
              isBreached ? "breached" : "safe"
            );
            
            console.log('✅ Scan save result:', saveResult);
            
            if (saveResult.status === 'success') {
              toast.success("✅ Result saved to history");
            } else {
              console.error('❌ Failed to save scan:', saveResult.message);
            }
          } else {
            console.warn('⚠️ No user_id found in localStorage - scan not saved');
          }
        } catch (err) {
          console.error("❌ Failed to save scan:", err);
        }
      }
      // REMOVED: Guest scan message (already shown above)

      if (isBreached) toast.error("⚠️ Security Alert: Email Found in Breaches");
      else toast.success("✅ Your email is safe!");

    } catch (err) {
      // If the API returns 404, it usually means No Breaches Found
      const safeResult = { breached: false, sources: [], count: 0, email: email };
      setResult(safeResult);
      setScanData({ input: email, result: safeResult });
      onScanComplete();
      toast.success("✅ No breaches found");
    } finally {
      setChecking(false);
    }
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
            {checking ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Checking...</> : "Check Email"}
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
        <div className="mt-6 space-y-4 animate-in fade-in zoom-in-95 duration-500">
          
          {/* BREACH STATUS CARD (YES/NO) */}
          {result.breached ? (
            <div className="relative overflow-hidden rounded-xl border-2 border-destructive bg-destructive/5 p-6 text-center shadow-lg shadow-destructive/10">
              <div className="flex flex-col items-center gap-3">
                <div className="p-3 bg-destructive/20 rounded-full">
                  <ShieldAlert className="w-10 h-10 text-destructive animate-pulse" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-destructive uppercase">Yes — Compromised</h3>
                  <p className="text-muted-foreground max-w-xs mx-auto mt-2">
                    This email was found in <span className="text-destructive font-bold">{result.count}</span> known data breach.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-xl border-2 border-primary bg-primary/5 p-6 text-center shadow-lg shadow-primary/10">
              <div className="flex flex-col items-center gap-3">
                <div className="p-3 bg-primary/20 rounded-full">
                  <CheckCircle className="w-10 h-10 text-primary" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-primary uppercase">No — Safe</h3>
                  <p className="text-muted-foreground max-w-xs mx-auto mt-2">
                    We didn't find this email in any major public data breaches.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SOURCE DETAILS */}
          {result.breached && result.sources.length > 0 && (
            <div className="p-5 rounded-lg border border-border bg-card/50 backdrop-blur-sm space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                <h3 className="font-heading font-semibold text-foreground">Leaked Sources</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {result.sources.map((s: string, i: number) => (
                  <span key={i} className="px-3 py-1 bg-destructive/10 border border-destructive/20 text-destructive text-xs font-mono rounded-md">
                    {s}
                  </span>
                ))}
              </div>
              <p className="text-xs text-muted-foreground pt-2">
                Recommendation: Change your password if you use the same one across these services.
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default EmailBreachChecker;