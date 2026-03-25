import { useState } from "react";
import { Search, Loader2, CheckCircle, AlertTriangle, Shield, Link, FileText, Lock, Download, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { analyzeUrl, type UrlAnalysis } from "@/lib/mockData";
import { generateReport } from "@/lib/generateReport";

interface UrlScannerProps {
  onScanComplete: () => void;
}

const getScoreColor = (score: number) => {
  if (score >= 75) return { bar: "bg-primary", text: "text-primary", label: "Safe" };
  if (score >= 50) return { bar: "bg-accent", text: "text-accent", label: "Suspicious" };
  return { bar: "bg-destructive", text: "text-destructive", label: "High Risk" };
};

const reasonIcons: Record<string, React.ReactNode> = {
  "URL Length": <Link className="w-4 h-4" />,
  "Suspicious Keywords": <Type className="w-4 h-4" />,
  "Special Characters": <Shield className="w-4 h-4" />,
  "Protocol": <Lock className="w-4 h-4" />,
};

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

  const scoreInfo = result ? getScoreColor(result.score) : null;

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

      {result && scoreInfo && (
        <div className="mt-4 space-y-4 animate-fade-in-up">
          {/* Status banner */}
          <div className={`p-4 rounded-md border flex items-center gap-3 ${
            result.status === "safe" ? "bg-primary/10 border-primary/30" : "bg-destructive/10 border-destructive/30"
          }`}>
            {result.status === "safe" ? <CheckCircle className="w-6 h-6 text-primary shrink-0" /> : <AlertTriangle className="w-6 h-6 text-destructive shrink-0" />}
            <div className="flex-1 min-w-0">
              <p className={`font-heading font-semibold ${result.status === "safe" ? "text-primary" : "text-destructive"}`}>
                {result.status === "safe" ? "Safe" : "Phishing Detected"}
              </p>
              <p className="text-muted-foreground text-sm truncate">{result.url}</p>
            </div>
          </div>

          {/* Risk Score Bar */}
          <div className="bg-muted/50 rounded-lg border border-border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-heading text-foreground">Risk Score</span>
              <span className={`font-mono font-bold text-lg ${scoreInfo.text}`}>
                {result.score}/100
              </span>
            </div>
            <div className="relative h-3 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${scoreInfo.bar}`}
                style={{ width: `${result.score}%` }}
              />
            </div>
            <p className={`text-xs font-heading ${scoreInfo.text}`}>{scoreInfo.label}</p>
          </div>

          {/* Detailed Findings */}
          <div className="grid gap-2">
            {result.reasons.map((r, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded border border-border text-sm gap-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className={r.flagged ? "text-destructive" : "text-primary"}>
                    {reasonIcons[r.label] || <Shield className="w-4 h-4" />}
                  </span>
                  {r.label}
                </div>
                <span className={`font-mono text-right ${r.flagged ? "text-destructive" : "text-primary"}`}>{r.value}</span>
              </div>
            ))}
          </div>

          {/* Report Preview & Download */}
          <div className="bg-muted/30 rounded-lg border border-border p-4 space-y-3 animate-fade-in-up">
            <div className="flex items-center gap-2 text-foreground font-heading text-sm">
              <FileText className="w-4 h-4 text-primary" /> Report Preview
            </div>
            <div className="text-xs text-muted-foreground space-y-1 font-mono">
              <p>APGS Security Risk Report</p>
              <p>URL: {result.url.length > 50 ? result.url.substring(0, 50) + "..." : result.url}</p>
              <p>Result: {result.status === "safe" ? "SAFE" : "PHISHING"} | Score: {result.score}/100</p>
              <p>Findings: {result.reasons.length} analysis points</p>
            </div>
            <Button
              onClick={() => generateReport(result)}
              className="w-full font-heading hover:shadow-[0_0_20px_hsl(150_100%_45%/0.4)] transition-shadow animate-pulse-glow"
            >
              <Download className="w-4 h-4 mr-2" /> Download PDF Report
            </Button>
          </div>
        </div>
      )}
    </section>
  );
};

export default UrlScanner;
