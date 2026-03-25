import { useState } from "react";
import { Search, Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { analyzeUrl, type UrlAnalysis } from "@/lib/mockData";

interface UrlScannerProps {
  onScanComplete: () => void;
}

const UrlScanner = ({ onScanComplete }: UrlScannerProps) => {
  const [url, setUrl] = useState("");
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<UrlAnalysis | null>(null);

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) { toast.error("Enter a URL to analyze"); return; }
    setScanning(true);
    setResult(null);
    setTimeout(() => {
      const analysis = analyzeUrl(url);
      setResult(analysis);
      setScanning(false);
      onScanComplete();
      if (analysis.status === "phishing") toast.error("⚠️ Phishing threat detected!");
      else toast.success("✅ URL appears safe");
    }, 2000);
  };

  return (
    <section className="bg-card border border-border rounded-lg p-6 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
      <h2 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
        <Search className="w-5 h-5 text-primary" /> URL Phishing Detector
      </h2>
      <form onSubmit={handleAnalyze} className="flex gap-3 flex-col sm:flex-row">
        <Input
          type="text"
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1 bg-muted border-border text-foreground placeholder:text-muted-foreground focus:shadow-[0_0_12px_hsl(150_100%_45%/0.2)]"
        />
        <Button type="submit" disabled={scanning} className="font-heading shrink-0 hover:shadow-[0_0_16px_hsl(150_100%_45%/0.3)] transition-shadow">
          {scanning ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Scanning...</> : "Analyze URL"}
        </Button>
      </form>

      {scanning && (
        <div className="mt-4 space-y-2 animate-fade-in-up">
          <p className="text-muted-foreground text-sm font-mono">Analyzing URL structure...</p>
          <Progress value={66} className="h-2" />
        </div>
      )}

      {result && (
        <div className="mt-4 space-y-3 animate-fade-in-up">
          <div className={`p-4 rounded-md border flex items-center gap-3 ${
            result.status === "safe" ? "bg-primary/10 border-primary/30" : "bg-destructive/10 border-destructive/30"
          }`}>
            {result.status === "safe" ? <CheckCircle className="w-6 h-6 text-primary shrink-0" /> : <AlertTriangle className="w-6 h-6 text-destructive shrink-0" />}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className={`font-heading font-semibold ${result.status === "safe" ? "text-primary" : "text-destructive"}`}>
                  {result.status === "safe" ? "Safe" : "Phishing Detected"}
                </p>
                <span className={`font-mono text-sm ${result.score >= 75 ? "text-primary" : result.score >= 50 ? "text-accent" : "text-destructive"}`}>
                  Score: {result.score}/100
                </span>
              </div>
              <p className="text-muted-foreground text-sm truncate">{result.url}</p>
            </div>
          </div>
          <div className="grid gap-2">
            {result.reasons.map((r, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded border border-border text-sm">
                <span className="text-muted-foreground">{r.label}</span>
                <span className={`font-mono ${r.flagged ? "text-destructive" : "text-primary"}`}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default UrlScanner;
