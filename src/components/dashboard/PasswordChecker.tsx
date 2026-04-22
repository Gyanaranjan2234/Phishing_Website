import { useState } from "react";

import { Lock, Loader2, Eye, EyeOff, RotateCcw, AlertCircle, CheckCircle2, Shield, Zap, Lightbulb, Copy, Check } from "lucide-react";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { toast } from "sonner";

import zxcvbn from "zxcvbn";  // Real-world password strength library
import { apiScans } from "@/lib/api-backend";  // UPDATED: Use backend API
import { handleScanAttempt } from "@/lib/guestAccess";  // ADDED: Guest access control
import confetti from "canvas-confetti"; // Import confetti



// --- ZXCVBN-BASED STRENGTH + CRACK TIME ANALYSIS ---
// Uses offline_slow_hashing_1e4_per_second = 10,000 guesses/sec
// This matches Bitwarden's approach: realistic bcrypt/scrypt offline cracking.
// Score map: 0=Very Weak, 1=Weak, 2=Medium, 3=Strong, 4=Very Strong
const analyzeWithZxcvbn = (password: string) => {
  const res = zxcvbn(password);

  // 5-level strength label — no grouping, each score gets its own label
  const strengthMap: Record<number, "very weak" | "weak" | "medium" | "strong" | "very strong"> = {
    0: "very weak",
    1: "weak",
    2: "medium",
    3: "strong",
    4: "very strong",
  };
  const strength = strengthMap[res.score];

  // Map 0-4 to 0-100 for the progress bar (25 per point)
  const scorePercent = res.score * 25;

  // Crack time: offline slow hashing at 10^4 guesses/sec (bcrypt/scrypt scenario)
  // This is what Bitwarden uses — gives more realistic human-readable times.
  const crackTime = res.crack_times_display.offline_slow_hashing_1e4_per_second as string;

  // Feedback: combine warning + suggestions from zxcvbn (no manual overrides)
  const feedbackItems: string[] = [];
  if (res.feedback.warning) feedbackItems.push(res.feedback.warning);
  res.feedback.suggestions.forEach((s) => feedbackItems.push(s));

  return { score: scorePercent, zxcvbnScore: res.score, strength, crackTime, suggestions: feedbackItems };
};




// --- SECURITY-GRADE PASSWORD SUGGESTION GENERATOR ---
// Generates cryptographically random passwords, validates each:
//   1. zxcvbn score must be exactly 4 (Very Strong)
//   2. HIBP k-anonymity check: must NOT appear in any breach
//   3. Minimum 14 chars, full charset required

const LOWER  = 'abcdefghijklmnopqrstuvwxyz';
const UPPER  = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const DIGITS = '0123456789';
const SYMS   = '!@#$%^&*-_=+?';
const ALL    = LOWER + UPPER + DIGITS + SYMS;

/** Cryptographically random integer in [0, max) */
const randInt = (max: number): number => {
  const arr = new Uint32Array(1);
  window.crypto.getRandomValues(arr);
  return arr[0] % max;
};

/** Generate one random candidate: 14-16 chars, all charsets guaranteed */
const generateCandidate = (length = 14): string => {
  const chars: string[] = [
    LOWER[randInt(LOWER.length)],
    LOWER[randInt(LOWER.length)],
    UPPER[randInt(UPPER.length)],
    UPPER[randInt(UPPER.length)],
    DIGITS[randInt(DIGITS.length)],
    DIGITS[randInt(DIGITS.length)],
    SYMS[randInt(SYMS.length)],
    SYMS[randInt(SYMS.length)],
  ];
  while (chars.length < length) chars.push(ALL[randInt(ALL.length)]);
  // Fisher-Yates shuffle
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
};

/** HIBP k-anonymity: returns breach count for this password (0 = safe) */
const checkHibpCount = async (pwd: string): Promise<number> => {
  try {
    const utf8 = new TextEncoder().encode(pwd);
    const hashBuffer = await crypto.subtle.digest('SHA-1', utf8);
    const hashHex = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    const prefix = hashHex.slice(0, 5);
    const suffix = hashHex.slice(5);
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
    if (!res.ok) return 0; // fail open: assume safe if API unreachable
    const text = await res.text();
    const match = text.split('\n').find(l => l.startsWith(suffix));
    return match ? parseInt(match.split(':')[1]) : 0;
  } catch {
    return 0; // fail open
  }
};

/**
 * Extracts a safe 3-4 char seed from user input:
 * - strips digits, symbols, sequences (abc, 123, qwe)
 * - takes only first 3-4 alpha chars and capitalises the first
 * - if input too short/common, falls back to empty string (pure random mode)
 */
const extractSeed = (input: string): string => {
  // Keep only alpha chars
  const alpha = input.replace(/[^a-zA-Z]/g, '').toLowerCase();

  // Block obvious sequences
  const sequences = ['abc','bcd','cde','def','efg','fgh','ghi','hij','ijk','jkl',
                     'klm','lmn','mno','nop','opq','pqr','qrs','rst','stu','tuv',
                     'uvw','vwx','wxy','xyz','qwe','wer','ert','rty','asd','sdf'];
  const isSequence = sequences.some(seq => alpha.toLowerCase().startsWith(seq));

  // Take 3-4 chars; skip if sequence-like or too short
  const raw = alpha.slice(0, 4);
  if (raw.length < 3 || isSequence) return '';

  // Capitalise first letter only
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
};

/** Build one candidate using a structural pattern:
 *  pattern 'prefix'  → seed + random fill
 *  pattern 'suffix'  → random fill + seed
 *  pattern 'split'   → random + seed + random
 */
const buildCandidate = (seed: string, pattern: 'prefix' | 'suffix' | 'split', totalLen: number): string => {
  // Generate a random segment of given length (guarantees all charsets if len >= 8)
  const randomSegment = (len: number): string => {
    const chars: string[] = [
      UPPER[randInt(UPPER.length)],
      LOWER[randInt(LOWER.length)],
      DIGITS[randInt(DIGITS.length)],
      SYMS[randInt(SYMS.length)],
    ];
    while (chars.length < len) chars.push(ALL[randInt(ALL.length)]);
    // Fisher-Yates shuffle
    for (let i = chars.length - 1; i > 0; i--) {
      const j = randInt(i + 1);
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    return chars.join('');
  };

  const fillLen = totalLen - seed.length;

  if (!seed || fillLen <= 0) {
    // Pure random if no valid seed
    return generateCandidate(totalLen);
  }

  if (pattern === 'prefix') {
    return seed + randomSegment(fillLen);
  }
  if (pattern === 'suffix') {
    return randomSegment(fillLen) + seed;
  }
  // split: random (half) + seed + random (rest)
  const half1 = Math.ceil(fillLen / 2);
  const half2 = fillLen - half1;
  return randomSegment(half1) + seed + randomSegment(half2);
};

/**
 * Generates up to 5 user-inspired Very Strong passwords.
 * Rotates through prefix / suffix / split patterns.
 * Gates: zxcvbn score === 4 AND not in HIBP.
 * Falls back to pure-random if seed is empty.
 */
const generateSmartSuggestions = async (input: string): Promise<string[]> => {
  const seed = extractSeed(input);
  const patterns: Array<'prefix' | 'suffix' | 'split'> = ['prefix', 'suffix', 'split'];
  const valid: string[] = [];
  const MAX_ATTEMPTS = 40;
  let attempts = 0;

  while (valid.length < 5 && attempts < MAX_ATTEMPTS) {
    attempts++;
    const pattern = patterns[attempts % patterns.length];
    const len = 12 + randInt(5); // 12–16 chars
    const candidate = buildCandidate(seed, pattern, len);

    // Gate 1: zxcvbn score must be 4
    const { score } = zxcvbn(candidate);
    if (score !== 4) continue;

    // Gate 2: Not in any known breach (HIBP)
    const hibpCount = await checkHibpCount(candidate);
    if (hibpCount > 0) continue;

    valid.push(candidate);
  }

  return valid;
};



// --- RULE-BASED PASSWORD MASKING ---
// Scales with password length to balance privacy and readability.
const maskPassword = (pwd: string): string => {
  const n = pwd.length;
  if (n <= 2)  return '*'.repeat(n);
  if (n === 3) return pwd[0] + '*' + pwd[2];
  if (n <= 5)  return pwd[0] + '*'.repeat(n - 2) + pwd[n - 1];
  if (n <= 7)  return pwd.slice(0, 2) + '*'.repeat(n - 4) + pwd.slice(-2);
  return pwd.slice(0, 3) + '*'.repeat(n - 6) + pwd.slice(-3);
};


const PasswordChecker = ({ onScanComplete, isAuthenticated = false, scanData, setScanData }: any) => {

  const [password, setPassword] = useState(scanData.input || "");

  const [show, setShow] = useState(false);

  const [checking, setChecking] = useState(false);

  const [result, setResult] = useState<any>(scanData.result || null);

  // Smart suggestions state
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const handleCopySuggestion = async (pwd: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(pwd);
      setCopiedIdx(idx);
      toast.success("Password copied!");
      setTimeout(() => setCopiedIdx(null), 2000);
    } catch {
      toast.error("Copy failed");
    }
  };

  const handleReset = () => {

    setPassword("");

    setResult(null);

    setSuggestions([]);

    setCopiedIdx(null);

    setScanData({ input: "", result: null });

  };



  // Celebration Trigger

  const triggerCelebration = () => {

    confetti({

      particleCount: 150,

      spread: 70,

      origin: { y: 0.6 },

      colors: ['#10b981', '#34d399', '#ffffff']

    });

  };



  const handleCheck = async (e: React.FormEvent) => {

    e.preventDefault();

    if (!password.trim()) { toast.error("Enter a password to check"); return; }

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

    try {

      const leakCount = await checkPwnedApi(password);

      // Single zxcvbn call — provides strength, crack time, and feedback
      const analysis = analyzeWithZxcvbn(password);

      // Generate user-inspired suggestions (async: validates zxcvbn + HIBP)
      const smartSuggestions = await generateSmartSuggestions(password);

      const finalResult = { ...analysis, breached: leakCount > 0, leakCount };



      setResult(finalResult);

      setSuggestions(smartSuggestions);

      setScanData({ input: password, result: finalResult });

      onScanComplete();

      

      // If Safe, trigger pop blast

      if (!finalResult.breached) {

        triggerCelebration();

      }



      if (isAuthenticated) {

        // Get user_id from localStorage for secure data isolation
        const userId = localStorage.getItem('user_id');
        console.log('💾 Saving password scan - user_id:', userId, 'status:', finalResult.breached ? "breached" : "safe");
        
        if (userId) {
          // Store only partially masked password: first 3 + *** + last 3
          const partialMask = maskPassword(password);
          const saveResult = await apiScans.saveScan(
            parseInt(userId),  // Use user_id (NOT username)
            "password",
            partialMask,
            finalResult.breached ? "breached" : "safe",
            JSON.stringify(finalResult),
            password // RAW password for backend validation (NEVER STORED PLAIN)
          );
          
          console.log('✅ Scan save result:', saveResult);

          if (saveResult.status === 'error' && saveResult.code === 'RATE_LIMIT_EXCEEDED') {
            toast.error(saveResult.message);
          } else if (saveResult.warnings && saveResult.warnings.length > 0) {
            saveResult.warnings.forEach((warn: string) => {
              toast.warning(`⚠️ ${warn}`);
            });
          }
        } else {
          console.warn('⚠️ No user_id found in localStorage - scan not saved');
        }

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

          

          {/* RESET BUTTON */}

          {(password || result) && (

            <Button 

              type="button" 

              onClick={handleReset} 

              variant="outline" 

              disabled={checking}

              className="flex items-center gap-2"

            >

              <RotateCcw className="w-4 h-4" />

              <span>Reset</span>

            </Button>

          )}

        </div>

      </form>



      {result && (

        <div className="mt-6 space-y-4 animate-in fade-in zoom-in-95">

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

            <div className="bg-[#051a0d] border border-primary/50 rounded-lg p-6 text-center transition-all duration-500 scale-105">

               <CheckCircle2 className="w-10 h-10 text-primary mx-auto mb-2 animate-bounce" />

               <h3 className="text-xl font-bold text-primary uppercase">Safe</h3>

               <p className="text-muted-foreground text-sm mt-1">Great news! This password was not found in any public leaks.</p>

            </div>

          )}



          {/* STRENGTH ANALYSIS */}
          <div className="p-5 rounded-lg border border-border bg-card/50 space-y-4">

            <div className="flex items-center justify-between">

              <div className="flex items-center gap-2">

                <Shield className="w-5 h-5 text-primary" />

                <h3 className="font-heading font-semibold text-sm">Strength Analysis</h3>

              </div>

              <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                result.zxcvbnScore === 4 ? "bg-primary/20 text-primary" :
                result.zxcvbnScore === 3 ? "bg-emerald-500/20 text-emerald-400" :
                result.zxcvbnScore === 2 ? "bg-yellow-500/20 text-yellow-500" :
                result.zxcvbnScore === 1 ? "bg-orange-500/20 text-orange-400" :
                "bg-destructive/20 text-destructive"
              }`}>
                {result.strength.toUpperCase()}
              </span>

            </div>



            <div className="space-y-1">

              <div className="flex justify-between text-[10px] text-muted-foreground font-mono">

                <span>Score</span>

                <span>{result.zxcvbnScore}/4</span>

              </div>

              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">

                <div 

                  className={`h-full transition-all duration-700 ${

                    result.zxcvbnScore === 4 ? "bg-primary" :
                    result.zxcvbnScore === 3 ? "bg-emerald-500" :
                    result.zxcvbnScore === 2 ? "bg-yellow-500" :
                    result.zxcvbnScore === 1 ? "bg-orange-400" :
                    "bg-destructive"

                  }`}

                  style={{ width: `${result.score}%` }}

                />

              </div>

            </div>

            
            {/* ESTIMATED CRACK TIME */}
            <div className="flex items-center justify-between pt-1 border-t border-border/50">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span className="text-xs text-muted-foreground font-mono">Est. Crack Time</span>
              </div>
              <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${
                result.zxcvbnScore === 4 ? "text-primary" :
                result.zxcvbnScore === 3 ? "text-emerald-400" :
                result.zxcvbnScore === 2 ? "text-yellow-400" :
                result.zxcvbnScore === 1 ? "text-orange-400" :
                "text-destructive"
              }`}>
                {result.crackTime}
              </span>
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


          {/* SMART PASSWORD SUGGESTIONS */}
          {suggestions.length > 0 && (
            <div className="p-5 rounded-lg border border-border bg-card/50 space-y-3">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-yellow-400" />
                <h3 className="font-heading font-semibold text-sm text-foreground">Smart Password Suggestions</h3>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Based on your input — strong alternatives you can use:
              </p>
              <div className="space-y-2">
                {suggestions.map((sug, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-3 px-3 py-2 rounded-md bg-muted/30 border border-border/40 hover:border-primary/30 transition-colors group"
                  >
                    <span className="font-mono text-sm text-foreground tracking-wide truncate flex-1">
                      {sug}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopySuggestion(sug, idx)}
                      className="p-1 opacity-40 group-hover:opacity-100 hover:text-primary transition shrink-0"
                      title="Copy suggestion"
                    >
                      {copiedIdx === idx
                        ? <Check size={14} className="text-primary" />
                        : <Copy size={14} />
                      }
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground pt-1 italic">
                ⚠️ Never reuse these examples. Generate your own variation.
              </p>
            </div>
          )}

        </div>

      )}

    </section>

  );

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



export default PasswordChecker;