# 🔐 Guest Access Control Implementation

## ✅ What Was Implemented

Limited guest access for the Scanning Hub with a **3-scan limit** for unauthenticated users. Authenticated users have unlimited access.

---

## 📋 Changes Summary

| File | Change | Lines |
|------|--------|-------|
| `src/lib/guestAccess.ts` | ✅ **CREATED** - Guest access control utility | 115 (new) |
| `src/components/dashboard/UrlScanner.tsx` | ✅ Added guest check before scan | ~14 |
| `src/components/dashboard/EmailBreachChecker.tsx` | ✅ Added guest check before scan | ~15 |
| `src/components/dashboard/FileScanner.tsx` | ✅ Added guest check before scan | ~14 |
| `src/components/dashboard/PasswordChecker.tsx` | ✅ Added guest check before scan | ~13 |
| `src/pages/Scanning.tsx` | ✅ Added guest scan counter display | ~11 |

**Total**: ~182 lines added/modified

---

## 🎯 How It Works

### **Guest Users (Not Logged In):**

```
User attempts scan
  ↓
Check: Is user logged in? → NO
  ↓
Check: Guest scan count < 3? 
  ↓
YES → Allow scan + Increment count + Show "Guest scan 1 of 3"
  ↓
NO → Block scan + Show "Guest limit reached. Please login to continue scanning"
```

### **Authenticated Users (Logged In):**

```
User attempts scan
  ↓
Check: Is user logged in? → YES
  ↓
Allow scan (unlimited) + Save to database
  ↓
No restrictions
```

---

## 📊 Guest Access Flow

### **Scan Attempt Logic:**

```typescript
// In each scanner component (UrlScanner, EmailBreachChecker, etc.)

const handleAnalyze = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!url.trim()) { showToast("Enter a URL to analyze", "error"); return; }

  // GUEST ACCESS CHECK: Verify scan limit before proceeding
  const scanAccess = handleScanAttempt();
  if (!scanAccess.success) {
    // Guest limit reached - block scan and show message
    showToast(scanAccess.message, "error");
    return;
  }

  // Show guest scan info (only for guests)
  if (!isAuthenticated) {
    showToast(`📝 ${scanAccess.message}`, "info");
  }

  // Continue with scan...
};
```

---

## 🔧 Guest Access Control Utility

### **File: `src/lib/guestAccess.ts`**

#### **Key Functions:**

| Function | Purpose | Returns |
|----------|---------|---------|
| `isUserLoggedIn()` | Check if user is authenticated | `boolean` |
| `getGuestScanCount()` | Get current guest scan count | `number` |
| `incrementGuestScanCount()` | Increment scan count | `number` (new count) |
| `canGuestScan()` | Check if guest can scan | `{ allowed, count, limit, message }` |
| `handleScanAttempt()` | Main function - checks & increments | `{ success, message }` |
| `resetGuestScanCount()` | Reset guest count | `void` |

#### **Constants:**

```typescript
const GUEST_SCAN_LIMIT = 3;  // Maximum scans for guests
const GUEST_SCAN_COUNT_KEY = "guest_scan_count";  // localStorage key
```

---

## 💾 localStorage Keys

| Key | Value | Purpose |
|-----|-------|---------|
| `guest_scan_count` | `"0"`, `"1"`, `"2"`, `"3"` | Track guest scan count |
| `username` | `"johndoe"` | Check if user is logged in |
| `user_session` | `{ id, email, username }` | Store user session |

---

## 🎨 UI Changes

### **Scanning Hub Header:**

**For Guests:**
```
Guest mode: 1/3 scans used. Sign in to save history and get unlimited scans.
```

**For Logged-in Users:**
```
Your scan history is automatically saved.
```

### **Toast Messages:**

**Guest Scan Allowed:**
```
📝 Guest scan 1 of 3
```

**Guest Limit Reached:**
```
❌ Guest limit reached (3/3). Please login to continue scanning.
```

**Authenticated User:**
```
✅ Result saved to history
```

---

## 🔒 Security Features

### **Access Control:**

1. ✅ **Scan Limit Enforcement** - Guests limited to 3 scans
2. ✅ **Pre-Scan Validation** - Check performed BEFORE API call
3. ✅ **Clear Messaging** - Users know why scan was blocked
4. ✅ **No Auto-Redirect** - Users stay on page, can choose to login

### **Data Privacy:**

1. ✅ **Guest scans NOT saved** - No guest data in database
2. ✅ **Authenticated scans saved** - Full history for logged-in users
3. ✅ **localStorage only** - Guest count stored locally
4. ✅ **No tracking** - No server-side guest tracking

---

## 🧪 Testing Guide

### **Test 1: Guest Scanning (First 3 scans)**

1. **Don't login** - Stay as guest
2. Go to: http://localhost:5173/scanning
3. Perform URL scan → Should succeed with message "📝 Guest scan 1 of 3"
4. Perform Email scan → Should succeed with message "📝 Guest scan 2 of 3"
5. Perform File scan → Should succeed with message "📝 Guest scan 3 of 3"
6. Check header shows: "Guest mode: 3/3 scans used"

### **Test 2: Guest Limit Reached**

1. After 3 scans, try 4th scan
2. Should see error: "❌ Guest limit reached (3/3). Please login to continue scanning"
3. Scan should be **blocked** (no API call made)

### **Test 3: Login Resets Restrictions**

1. Click "Login" button
2. Login with your account
3. Go back to scanning page
4. Header should show: "Your scan history is automatically saved"
5. Perform unlimited scans - no restrictions

### **Test 4: Scan History**

1. **As guest** - Perform scan → Should NOT appear in history
2. **As logged-in user** - Perform scan → Should appear in history
3. Check activity history section - only logged-in user scans visible

---

## 📝 Code Examples

### **How to Check Guest Access (Manual):**

```typescript
import { canGuestScan, isUserLoggedIn } from "@/lib/guestAccess";

// Check if user can scan
const { allowed, count, limit, message } = canGuestScan();

if (!allowed) {
  console.log("Guest limit reached!");
  return;
}

// Check if logged in
if (isUserLoggedIn()) {
  console.log("Authenticated user - unlimited scans");
}
```

### **How to Reset Guest Count (After Login):**

```typescript
import { resetGuestScanCount } from "@/lib/guestAccess";

// Call this after successful login
resetGuestScanCount();
```

---

## ⚙️ Configuration

### **Change Guest Scan Limit:**

Edit `src/lib/guestAccess.ts`:

```typescript
const GUEST_SCAN_LIMIT = 3;  // Change this number
```

Examples:
- `2` = 2 scans allowed
- `5` = 5 scans allowed
- `10` = 10 scans allowed

---

## 🚀 Advanced Features (Future Enhancements)

### **Optional Improvements:**

1. **Server-side tracking** - Prevent localStorage bypass
2. **IP-based limiting** - Track by IP address
3. **Time-based reset** - Reset guest limit every 24 hours
4. **Email verification** - Require email before guest access
5. **Captcha** - Prevent automated scanning
6. **Rate limiting** - Limit scans per minute

### **Backend Integration (Not Implemented):**

Currently, guest limit is client-side only. For production:

```python
# Backend endpoint needed
@router.post("/api/scans/guest")
def guest_scan_check(ip_address: str):
    # Check IP-based scan count
    # Return allowed/blocked status
    pass
```

---

## 🐛 Troubleshooting

### **Issue: Guest can scan unlimited times**

**Cause:** localStorage cleared or bypassed

**Solution:**
- Check browser DevTools → Application → Local Storage
- Verify `guest_scan_count` key exists
- Clear and test again

### **Issue: Logged-in user sees guest limit**

**Cause:** Session not properly set

**Solution:**
- Check localStorage has `username` and `user_session`
- Logout and login again
- Verify `isUserLoggedIn()` returns `true`

### **Issue: Scan count not incrementing**

**Cause:** Function not being called

**Solution:**
- Check console for errors
- Verify `handleScanAttempt()` is called before scan
- Check toast messages appear

---

## 📊 Feature Comparison

| Feature | Guest Users | Authenticated Users |
|---------|-------------|---------------------|
| Scan Limit | 3 scans | Unlimited |
| Save History | ❌ No | ✅ Yes |
| View History | ❌ No | ✅ Yes |
| Dashboard Stats | ❌ No | ✅ Yes |
| Profile Access | ❌ No | ✅ Yes |
| All Scan Types | ✅ Yes | ✅ Yes |
| PDF Reports | ✅ Yes | ✅ Yes |

---

## ✅ Checklist

- [x] Guest access utility created
- [x] URL Scanner updated
- [x] Email Breach Checker updated
- [x] File Scanner updated
- [x] Password Checker updated
- [x] Scanning page shows guest count
- [x] Scan limit enforced (3 scans)
- [x] Clear error messages
- [x] No UI/design changes
- [x] No breaking changes
- [x] Modular, clean code
- [x] Well-commented code

---

## 🎯 Quick Commands

```bash
# Start Frontend
npm run dev

# Test Guest Access
# 1. Don't login
# 2. Go to /scanning
# 3. Perform 3 scans
# 4. Try 4th scan - should be blocked

# Test Authenticated Access
# 1. Login
# 2. Go to /scanning
# 3. Perform unlimited scans

# Clear Guest Data (for testing)
# Browser DevTools → Application → Local Storage
# Delete: guest_scan_count
```

---

## 📚 Related Files

- `src/lib/guestAccess.ts` - Guest access control logic
- `src/lib/api-backend.ts` - Backend API integration
- `src/pages/Scanning.tsx` - Scanning hub page
- `src/components/dashboard/*Scanner.tsx` - Scanner components

---

**Implementation Complete!** 🎉

Guest users can now perform **3 free scans** before being prompted to login. Authenticated users have **unlimited access** with full history tracking.
