import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Search, Upload, LogOut, AlertTriangle, CheckCircle, Loader2, FileUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type ScanResult = { status: "safe" | "phishing"; url: string } | null;

const Dashboard = () => {
  const navigate = useNavigate();
  const [url, setUrl] = useState("");
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileScanning, setFileScanning] = useState(false);
  const [fileResult, setFileResult] = useState<string | null>(null);

  const handleLogout = () => {
    localStorage.removeItem("apgs-auth");
    navigate("/login");
  };

  const analyzeUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      toast.error("Enter a URL to analyze");
      return;
    }
    setScanning(true);
    setResult(null);
    setTimeout(() => {
      const isPhishing = url.includes("free") || url.includes("login") || url.includes("verify") || url.includes("update") || url.includes("secure");
      setResult({ status: isPhishing ? "phishing" : "safe", url });
      setScanning(false);
    }, 2000);
  };

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const scanFile = () => {
    if (!file) return;
    setFileScanning(true);
    setFileResult(null);
    setTimeout(() => {
      setFileResult("No threats detected");
      setFileScanning(false);
      toast.success("File scan complete");
    }, 2500);
  };

  return (
    <div className="min-h-screen cyber-grid">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            <span className="font-heading font-bold text-primary text-lg">APGS</span>
          </div>
          <Button variant="ghost" onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Welcome */}
        <div className="animate-fade-in-up">
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground">Security Dashboard</h1>
          <p className="text-muted-foreground mt-1">Analyze URLs and scan files for threats</p>
        </div>

        {/* URL Scanner */}
        <section className="bg-card border border-border rounded-lg p-6 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          <h2 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
            <Search className="w-5 h-5 text-primary" /> URL Phishing Checker
          </h2>
          <form onSubmit={analyzeUrl} className="flex gap-3 flex-col sm:flex-row">
            <Input
              type="text"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1 bg-muted border-border text-foreground placeholder:text-muted-foreground"
            />
            <Button type="submit" disabled={scanning} className="bg-primary text-primary-foreground hover:bg-primary/90 font-heading shrink-0">
              {scanning ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Scanning...</> : "Analyze URL"}
            </Button>
          </form>

          {result && (
            <div className={`mt-4 p-4 rounded-md border flex items-center gap-3 animate-fade-in-up ${
              result.status === "safe"
                ? "bg-primary/10 border-primary/30"
                : "bg-destructive/10 border-destructive/30"
            }`}>
              {result.status === "safe" ? (
                <CheckCircle className="w-6 h-6 text-primary shrink-0" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-destructive shrink-0" />
              )}
              <div>
                <p className={`font-heading font-semibold ${result.status === "safe" ? "text-primary" : "text-destructive"}`}>
                  {result.status === "safe" ? "Safe" : "Phishing Detected"}
                </p>
                <p className="text-muted-foreground text-sm truncate max-w-md">{result.url}</p>
              </div>
            </div>
          )}
        </section>

        {/* File Upload */}
        <section className="bg-card border border-border rounded-lg p-6 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
          <h2 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" /> File Scanner
          </h2>
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors"
          >
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <FileUp className="w-6 h-6 text-primary" />
                <span className="text-foreground font-mono text-sm">{file.name}</span>
                <button onClick={() => { setFile(null); setFileResult(null); }} className="text-muted-foreground hover:text-destructive">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="cursor-pointer">
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">Drag & drop or <span className="text-primary underline">browse</span></p>
                <input type="file" className="hidden" onChange={handleFileSelect} />
              </label>
            )}
          </div>
          {file && (
            <div className="mt-4 flex items-center gap-3">
              <Button onClick={scanFile} disabled={fileScanning} className="bg-primary text-primary-foreground hover:bg-primary/90 font-heading">
                {fileScanning ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Scanning...</> : "Scan File"}
              </Button>
              {fileResult && (
                <span className="text-primary font-mono text-sm flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" /> {fileResult}
                </span>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
