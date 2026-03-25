import { useState } from "react";
import { Lock, Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { analyzePassword, type PasswordResult } from "@/lib/mockData";

interface PasswordCheckerProps {
  onScanComplete: () => void;
}

const PasswordChecker = ({ onScanComplete }: PasswordCheckerProps) => {
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<PasswordResult | null>(null);

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) { toast.error("Enter a password to check"); return; }
    setChecking(true);
    setResult(null);
    setTimeout(() => {
      const res = analyzePassword(password);
      setResult(res);
      setChecking(false);
      onScanComplete();
    }, 1500);
  };

  const strengthColor = result?.strength === "strong" ? "text-primary" : result?.strength === "medium" ? "text-accent" : "text-destructive";
  const progressColor = result?.strength === "strong" ? "[&>div]:bg-primary" : result?.strength === "medium" ? "[&>div]:bg-accent" : "[&>div]:bg-destructive";

  return (
    <section className="bg-card border border-border rounded-lg p-6 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
      <h2 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
        <Lock className="w-5 h-5 text-primary" /> Password Leak Checker
      </h2>
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
        <Button type="submit" disabled={checking} className="font-heading shrink-0 hover:shadow-[0_0_16px_hsl(150_100%_45%/0.3)] transition-shadow">
          {checking ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Checking...</> : "Check Password"}
        </Button>
      </form>

      {result && (
        <div className="mt-4 space-y-3 animate-fade-in-up">
          <div className="flex items-center justify-between">
            <span className={`font-heading font-semibold uppercase ${strengthColor}`}>{result.strength}</span>
            <span className="font-mono text-sm text-muted-foreground">{result.score}/100</span>
          </div>
          <Progress value={result.score} className={`h-2 ${progressColor}`} />
          {result.breached && (
            <p className="text-destructive text-sm font-mono">⚠️ This password has appeared in known data breaches</p>
          )}
          {result.suggestions.length > 0 && (
            <ul className="space-y-1">
              {result.suggestions.map((s, i) => (
                <li key={i} className="text-muted-foreground text-sm">• {s}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
};

export default PasswordChecker;
