import { useState } from "react";
import { Mail, Loader2, ShieldCheck, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { checkEmailBreach, type BreachResult } from "@/lib/mockData";

interface EmailBreachCheckerProps {
  onScanComplete: () => void;
  isAuthenticated?: boolean;
}

const EmailBreachChecker = ({ onScanComplete, isAuthenticated = false }: EmailBreachCheckerProps) => {
  const [email, setEmail] = useState("");
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<BreachResult | null>(null);

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { toast.error("Enter an email address"); return; }
    setChecking(true);
    setResult(null);
    setTimeout(() => {
      const res = checkEmailBreach(email);
      setResult(res);
      setChecking(false);
      onScanComplete();
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
        <Button type="submit" disabled={checking} className="font-heading shrink-0 hover:shadow-[0_0_16px_hsl(150_100%_45%/0.3)] transition-shadow">
          {checking ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Checking...</> : "Check Breach"}
        </Button>
      </form>

      {result && (
        <div className={`mt-4 p-4 rounded-md border flex items-start gap-3 animate-fade-in-up ${
          result.breached ? "bg-destructive/10 border-destructive/30" : "bg-primary/10 border-primary/30"
        }`}>
          {result.breached ? <ShieldAlert className="w-6 h-6 text-destructive shrink-0 mt-0.5" /> : <ShieldCheck className="w-6 h-6 text-primary shrink-0 mt-0.5" />}
          <div className="flex-1">
            <p className={`font-heading font-semibold ${result.breached ? "text-destructive" : "text-primary"}`}>
              {result.breached ? `Found in ${result.count} breach${result.count > 1 ? "es" : ""}` : "No Breaches Found"}
            </p>
            {result.breached && result.sources.length > 0 && (
              <ul className="mt-2 space-y-1">
                {result.sources.map((s, i) => (
                  <li key={i} className="text-muted-foreground text-sm font-mono">• {s}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default EmailBreachChecker;
