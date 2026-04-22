# 🔧 Global Scan Counter Implementation

## ✅ Overview

Implemented a **global scan counter** that **ONLY increases and NEVER decreases**, even when users clear their scan history.

---

## 📋 What Was Changed

### **1. New Database Model: `ScanStats`**

**File:** [`backend/models/scan_stats_model.py`](file:///c:/Users/gyana/OneDrive/Desktop/Phishing_Website/backend/models/scan_stats_model.py)

```python
class ScanStats(Base):
    """
    Global counter table - tracks total scans across all users.
    Values are NEVER decremented.
    """
    __tablename__ = "scan_stats"
    
    id = Column(Integer, primary_key=True, default=1)  # Single row
    total_scans = Column(Integer, nullable=False, default=0)  # NEVER decreases
    last_updated = Column(DateTime, default=datetime.utcnow)
```

**Key Features:**
- Single row (id=1) stores the global counter
- `total_scans` only increments, never decrements
- Persists across history deletions

---

### **2. Database Migration**

**File:** [`backend/migrate_add_scan_stats.py`](file:///c:/Users/gyana/OneDrive/Desktop/Phishing_Website/backend/migrate_add_scan_stats.py)

**What it does:**
1. Creates `scan_stats` table
2. Initializes counter with current scan count (84 scans)
3. Safe to run multiple times (idempotent)

**Migration Output:**
```
✅ scan_stats table created successfully
📊 Found 84 existing scans in database
✅ Global counter initialized to 84
```

---

### **3. Updated Save Scan Endpoint**

**File:** [`backend/routes/scans.py`](file:///c:/Users/gyana/OneDrive/Desktop/Phishing_Website/backend/routes/scans.py#L115-L139) - Lines 115-139

**Changes:**
```python
# After saving scan to history:
stats_record = db.query(ScanStats).filter(ScanStats.id == 1).first()
if stats_record:
    stats_record.total_scans += 1  # INCREMENT
    stats_record.last_updated = datetime.utcnow()
    db.commit()
```

**Behavior:**
- Every `POST /api/scans/save` increments `total_scans` by +1
- Error handling ensures scan save succeeds even if stats update fails
- Counter increases for ALL users (global)

---

### **4. Updated Stats Endpoint**

**File:** [`backend/routes/scans.py`](file:///c:/Users/gyana/OneDrive/Desktop/Phishing_Website/backend/routes/scans.py#L233-L291) - Lines 233-291

**Before:**
```python
# OLD: Calculated from user history (decreased when cleared)
total_scans = len(user_scans)  # ❌ Wrong!
```

**After:**
```python
# NEW: Uses global counter (NEVER decreases)
stats_record = db.query(ScanStats).filter(ScanStats.id == 1).first()
global_total_scans = stats_record.total_scans if stats_record else 0

# User-specific stats still calculated from history
safe_scans = len([s for s in user_scans if s.status in ["safe", ...]])
threat_scans = len([s for s in user_scans if s.status in ["phishing", ...]])

return {
    "totalScans": global_total_scans,  # ✅ GLOBAL - NEVER decreases
    "safeScans": safe_scans,            # User-specific
    "threatScans": threat_scans,         # User-specific
}
```

---

### **5. Updated Platform Stats Endpoint**

**File:** [`backend/main.py`](file:///c:/Users/gyana/OneDrive/Desktop/Phishing_Website/backend/main.py#L68-L82) - Lines 68-82

**Before:**
```python
total_scans = db.query(ScanHistory).count()  # ❌ Decreases on clear
```

**After:**
```python
stats_record = db.query(ScanStats).filter(ScanStats.id == 1).first()
total_scans = stats_record.total_scans if stats_record else 0  # ✅ NEVER decreases
```

---

## 🔄 API Flow

### **When User Performs a Scan:**

```
POST /api/scans/save
    ↓
1. Save scan to scan_history table (user-specific)
    ↓
2. Increment global counter: total_scans += 1
    ↓
3. Return success
```

**Result:**
- User's history: +1 record
- Global counter: +1 (total_scans)

---

### **When User Clears History:**

```
DELETE /api/scans/clear-history/{user_id}
    ↓
1. Delete all scan_history records for user
    ↓
2. DO NOT touch scan_stats table
    ↓
3. Return success
```

**Result:**
- User's history: 0 records (cleared)
- Global counter: **UNCHANGED** (still shows total ever performed)

---

### **When Fetching Stats:**

```
GET /api/scans/stats?user_id=1
    ↓
1. Get global total_scans from scan_stats table
    ↓
2. Calculate safe/threat counts from user's history
    ↓
3. Return combined stats
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "totalScans": 85,          // GLOBAL - NEVER decreases
    "safeScans": 5,            // User-specific (from history)
    "threatScans": 2,          // User-specific (from history)
    "suspiciousScans": 1       // User-specific (from history)
  }
}
```

---

## 📊 Database Schema

### **scan_stats Table**

| Column | Type | Description |
|--------|------|-------------|
| `id` | Integer | Primary key (always 1) |
| `total_scans` | Integer | Global counter (ONLY increases) |
| `last_updated` | DateTime | Last increment timestamp |

**Example Data:**
```
id | total_scans | last_updated
---|-------------|-------------------
1  | 85          | 2024-01-15 14:32:00
```

---

## ✅ Verification Steps

### **Test 1: Counter Increments on Scan**

1. Check current total: `GET /api/scans/stats?user_id=1`
2. Perform a scan: `POST /api/scans/save`
3. Check total again - should be +1

**Expected:**
```
Before: totalScans = 84
After:  totalScans = 85 ✅
```

---

### **Test 2: Counter Doesn't Decrease on Clear**

1. Check current total: `totalScans = 85`
2. Clear user history: `DELETE /api/scans/clear-history/1`
3. Check total again

**Expected:**
```
Before clear: totalScans = 85
After clear:  totalScans = 85 ✅ (UNCHANGED)
User history: 0 records (cleared)
```

---

### **Test 3: Multiple Users Share Global Counter**

1. User 1 performs scan → `totalScans = 86`
2. User 2 performs scan → `totalScans = 87`
3. User 1 clears history → `totalScans = 87` (unchanged)
4. User 2 clears history → `totalScans = 87` (unchanged)

**Result:** Global counter reflects ALL scans ever performed ✅

---

## 🎯 Goals Achieved

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| ✅ Do NOT calculate from history | Done | Uses `scan_stats` table |
| ✅ Separate global counter | Done | `scan_stats.total_scans` |
| ✅ Increment on every scan | Done | `POST /save` increments +1 |
| ✅ Don't change on clear | Done | Clear history skips stats table |
| ✅ API returns from `/stats` | Done | `GET /stats` returns global counter |
| ✅ ONLY increases | Done | No decrement logic anywhere |
| ✅ NEVER decreases | Done | Verified in all endpoints |

---

## 🔒 Data Integrity

### **What Happens When:**

| Action | scan_history | scan_stats (total_scans) |
|--------|--------------|--------------------------|
| User scans | +1 record | +1 (increments) |
| User clears history | All deleted | **UNCHANGED** |
| User deletes single scan | -1 record | **UNCHANGED** |
| New user joins | 0 records | **UNCHANGED** |
| Multiple users scan | +N records | +N (increments) |

---

## 📝 Notes

### **Why This Design?**

1. **Accurate Metrics:** Shows true platform usage over time
2. **User Trust:** Numbers always go up (psychological effect)
3. **Analytics:** Useful for tracking growth and engagement
4. **Data Isolation:** User history can be cleared without affecting global stats

### **Future Enhancements (Optional):**

- Per-user total scan counters (if needed)
- Daily/monthly scan statistics
- Scan type breakdown (URL, email, file, password)
- Time-series analytics

---

## 🚀 Deployment

### **Migration Already Run:**
```bash
✅ Database table created
✅ Counter initialized to 84 (current scans)
✅ Ready to use
```

### **No Additional Steps Required:**
- Backend automatically uses new counter
- Frontend already fetches from `/stats` endpoint
- No frontend changes needed

---

**Implementation Complete!** 🎉

Total scans now ONLY increase and NEVER decrease, providing accurate platform-wide metrics.
