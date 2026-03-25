import { useState, useCallback } from "react";
import { Upload, FileUp, X, Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { scanFile } from "@/lib/mockData";

interface FileScannerProps {
  onScanComplete: () => void;
}

const FileScanner = ({ onScanComplete }: FileScannerProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) { setFile(f); setResult(null); }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setFile(f); setResult(null); }
  };

  const handleScan = () => {
    if (!file) return;
    setScanning(true);
    setResult(null);
    setTimeout(() => {
      const res = scanFile(file.name);
      setResult(res);
      setScanning(false);
      onScanComplete();
      toast.success("File scan complete");
    }, 2500);
  };

  const isSafe = result === "No threats detected";

  return (
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
            <button onClick={() => { setFile(null); setResult(null); }} className="text-muted-foreground hover:text-destructive">
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
          <Button onClick={handleScan} disabled={scanning} className="font-heading hover:shadow-[0_0_16px_hsl(150_100%_45%/0.3)] transition-shadow">
            {scanning ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Scanning...</> : "Scan File"}
          </Button>
          {result && (
            <span className={`font-mono text-sm flex items-center gap-1 ${isSafe ? "text-primary" : "text-destructive"}`}>
              {isSafe ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />} {result}
            </span>
          )}
        </div>
      )}
    </section>
  );
};

export default FileScanner;
