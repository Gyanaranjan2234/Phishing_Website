import os
import httpx
import asyncio
from phishing_model import analyze_url
import logging
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

VT_API_KEY = os.getenv("VIRUSTOTAL_API_KEY")
VT_BASE_URL = "https://www.virustotal.com/api/v3"


async def get_vt_report(url: str) -> dict:
    """
    Fetch VirusTotal analysis for the given URL.
    Returns a structured stats dict or {"error": <reason>} on any failure.
    Never raises — always returns a dict.
    """
    if not VT_API_KEY:
        logger.warning("VIRUSTOTAL_API_KEY not found in environment.")
        return {"error": "API Key Missing"}

    import base64
    # VT requires base64-URL-encoded URL (no padding)
    url_id = base64.urlsafe_b64encode(url.encode()).decode().strip("=")

    headers = {
        "x-apikey": VT_API_KEY,
        "accept":   "application/json",
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{VT_BASE_URL}/urls/{url_id}",
                headers=headers,
                timeout=8.0,
            )

        if response.status_code == 200:
            data    = response.json()
            attr    = data["data"]["attributes"]
            stats   = attr["last_analysis_stats"]
            results = attr.get("last_analysis_results", {})

            malicious  = stats.get("malicious",  0)
            suspicious = stats.get("suspicious", 0)
            harmless   = stats.get("harmless",   0)
            undetected = stats.get("undetected", 0)
            total      = sum(stats.values()) if stats else 0

            malicious_engines = [
                name for name, res in results.items()
                if res.get("category") == "malicious"
            ]

            return {
                "malicious":         malicious,
                "suspicious":        suspicious,
                "harmless":          harmless,
                "undetected":        undetected,
                "total":             total,
                "malicious_engines": malicious_engines,
                "last_analysis":     attr.get("last_analysis_date"),
            }

        elif response.status_code == 404:
            return {"error": "URL not in VirusTotal database"}
        else:
            return {"error": f"VT HTTP {response.status_code}"}

    except asyncio.TimeoutError:
        logger.error("VirusTotal request timed out.")
        return {"error": "API Timeout"}
    except Exception as exc:
        logger.error(f"VirusTotal request failed: {exc}")
        return {"error": str(exc)}


# ── Score helpers ─────────────────────────────────────────────────────────────

def _model_score(model_result: dict) -> int:
    """
    Convert AI model output to a 0-100 risk score.
      phishing prediction  →  score = confidence * 100
      safe    prediction   →  score = (1 - confidence) * 100
    """
    confidence  = float(model_result["confidence"])
    is_phishing = model_result["prediction"].lower() == "phishing"
    raw         = confidence if is_phishing else (1.0 - confidence)
    return int(round(raw * 100))


def _score_to_risk(score: int) -> str:
    """
    Map 0-100 score to risk label (per spec):
      0        → SAFE
      1-10     → LOW
      11-30    → MODERATE
      31-70    → HIGH
      71-100   → DANGEROUS
    """
    if score == 0:
        return "SAFE"
    if score <= 10:
        return "LOW"
    if score <= 30:
        return "MODERATE"
    if score <= 70:
        return "HIGH RISK"
    return "DANGEROUS"


def _risk_message(risk: str, source: str, extra: str = "") -> str:
    base = f"Scan complete via {source}. {extra}"
    if risk == "DANGEROUS":
        return base + "CRITICAL: Confirmed phishing threat. Do not interact with this URL."
    if risk == "HIGH":
        return base + "WARNING: High phishing probability. Exercise extreme caution."
    if risk == "MODERATE":
        return base + "Caution: Suspicious characteristics detected. Verify independently."
    if risk == "LOW":
        return base + "Minimal risk detected. Apply standard security precautions."
    return base + "This URL appears safe based on current analysis."


# ── Main scan entry point ─────────────────────────────────────────────────────

async def run_full_scan(url: str, mode: str = "quick") -> dict:
    """
    QUICK mode:
      - Runs AI model ONLY. VirusTotal is NEVER called.
      - score  = model confidence-based (see _model_score)
      - source = "AI_MODEL"
      - api_analysis = null

    DEEP mode:
      - Runs AI model AND VirusTotal concurrently via asyncio.gather.
      - model_score = AI confidence * 100
      - api_score   = (flagged_vendors / total) * 100
      - flagged_vendors = total - harmless - undetected
      - final_score = (model_score + api_score) / 2   [equal-weight average]
      - Conditional adjustments (dynamic increments):
          malicious >= 3  → final_score = max(final_score, final_score + 25)
          malicious >= 1  → final_score = max(final_score, final_score + 15)
          suspicious >= 1 → final_score = max(final_score, final_score + 10)
      - Final score capped at 100 via min(final_score, 100).
      - Risk label is always derived from final adjusted score.
      - source = "AI_MODEL + VIRUSTOTAL"  (or "AI_MODEL (API FAILED)")
    """

    loop = asyncio.get_event_loop()

    # =========================================================
    # QUICK SCAN — AI ONLY
    # =========================================================
    if mode != "deep":
        model_result = await loop.run_in_executor(None, analyze_url, url)
        score        = _model_score(model_result)
        risk         = _score_to_risk(score)

        return {
            "score":          min(100, max(0, score)),
            "risk":           risk,
            "mode":           "quick",
            "source":         "AI_MODEL",
            "model_analysis": model_result,
            "api_analysis":   None,
            "message":        _risk_message(risk, "AI model only"),
        }

    # =========================================================
    # DEEP SCAN — AI + VIRUSTOTAL (parallel)
    # =========================================================
    # Run both concurrently
    try:
        model_result, api_result = await asyncio.gather(
            loop.run_in_executor(None, analyze_url, url),
            asyncio.wait_for(get_vt_report(url), timeout=10.0),
        )
    except asyncio.TimeoutError:
        logger.warning("VirusTotal timed out during deep scan gather.")
        model_result = await loop.run_in_executor(None, analyze_url, url)
        api_result   = {"error": "API Timeout"}
    except Exception as exc:
        logger.error(f"Deep scan gather failed: {exc}")
        model_result = await loop.run_in_executor(None, analyze_url, url)
        api_result   = {"error": str(exc)}

    ms     = _model_score(model_result)
    api_ok = isinstance(api_result, dict) and "error" not in api_result

    if api_ok:
        malicious  = int(api_result.get("malicious",  0))
        suspicious = int(api_result.get("suspicious", 0))
        harmless   = int(api_result.get("harmless",   0))
        undetected = int(api_result.get("undetected", 0))
        total      = int(api_result.get("total",       1)) or 1   # avoid /0

        # ── Base formula: equal-weight average of AI + API scores ──────────
        # New logic: flagged_vendors = total - harmless - undetected
        flagged_vendors = total - harmless - undetected
        api_score       = (flagged_vendors / total) * 100
        final_score     = (ms + api_score) / 2

        # ── Conditional adjustments (mandatory) ───────────────────────
        if malicious >= 3:
            final_score = max(final_score, final_score + 25)
        elif malicious >= 1:
            final_score = max(final_score, final_score + 15)
        elif suspicious >= 1:
            final_score = max(final_score, final_score + 10)

        final_score = int(round(min(100, max(0, final_score))))
        risk        = _score_to_risk(final_score)

        source = "AI_MODEL + VIRUSTOTAL"
        extra  = f"Detected by {malicious}/{total} security vendors. "

    else:
        # API failed — expose it explicitly
        err_detail  = api_result.get("error", "Unknown") if isinstance(api_result, dict) else "No response"
        final_score = ms
        risk        = _score_to_risk(final_score)
        source      = "AI_MODEL (API FAILED)"
        extra       = f"VirusTotal unavailable ({err_detail}). Score based on AI only. "

    return {
        "score":          final_score,
        "risk":           risk,
        "mode":           "deep",
        "source":         source,
        "model_analysis": model_result,
        "api_analysis":   api_result,   # always present; may contain "error" key
        "message":        _risk_message(risk, source, extra),
    }
