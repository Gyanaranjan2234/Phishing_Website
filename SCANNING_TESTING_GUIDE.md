# Scanning System - Testing Guide

## 🧪 Pre-Testing Checklist

Before testing, ensure:
- [ ] You have Node.js and npm installed
- [ ] Project dependencies installed (`npm install`)
- [ ] Build succeeds (`npm run build`)
- [ ] Dev server can start (`npm run dev`)
- [ ] You have at least 2 test accounts (one logged in, one logged out)

---

## ✅ Test Suite 1: Authentication UI

### Test 1.1 - Login CTA Visibility
```
Status: Unauthenticated (logged out or new user)
Steps:
1. Navigate to /scanning
2. Look for section titled "Save Your Scan History"
3. Look for [Login] and [Sign Up] buttons

Expected Result:
✅ Section visible
✅ Buttons are clickable
✅ Login button goes to /login
✅ Sign Up button goes to /login?view=signup
```

### Test 1.2 - Login CTA Hidden When Authenticated
```
Status: Authenticated (logged in)
Steps:
1. Login with valid credentials
2. Navigate to /scanning
3. Look for "Save Your Scan History" section

Expected Result:
✅ Section NOT visible
✅ Main "Scanning Hub" description says "Your scan history is automatically saved"
✅ No login buttons in the scanning area
```

### Test 1.3 - Guest Scan Messaging
```
Status: Unauthenticated (guest)
Steps:
1. Stay logged out
2. Navigate to /scanning
3. Enter a URL (e.g., "https://example.com")
4. Click "Analyze URL"
5. Wait for results

Expected Result:
✅ Scan completes
✅ Results display correctly
✅ Toast shows: "📝 Guest scan (not saved - login to save history)"
✅ Result does NOT appear in history (if history visible)
```

---

## ✅ Test Suite 2: Scan History Saving

### Test 2.1 - URL Scan Saves
```
Status: Authenticated
Steps:
1. Login with valid credentials
2. Go to /scanning
3. Click URL Scanner tab
4. Enter: "https://phishing-example.com"
5. Click "Analyze URL"
6. Wait for results

Expected Result:
✅ Results display
✅ Toast shows: "✅ Result saved to history"
✅ Scroll down to ActivityHistory
✅ New scan entry appears in history (most recent at top)
✅ Shows: URL, status, "X mins ago"
```

### Test 2.2 - Email Scan Saves
```
Status: Authenticated
Steps:
1. Click Email tab
2. Enter: "test@example.com"
3. Click "Check Breach"
4. Wait for results

Expected Result:
✅ Results display
✅ Toast shows: "✅ Result saved to history"
✅ New entry appears in ActivityHistory
✅ Shows email address and status
```

### Test 2.3 - File Scan Saves
```
Status: Authenticated
Steps:
1. Click File Scanner tab
2. Select any file (or drag & drop)
3. Click "Scan File"
4. Wait for scan to complete

Expected Result:
✅ Scan progress shows
✅ Results display when done
✅ Toast shows: "✅ Result saved to history"
✅ New entry in ActivityHistory
✅ Shows filename and status
```

### Test 2.4 - Password Scan Saves
```
Status: Authenticated
Steps:
1. Click Password tab
2. Enter: "SecurePassword123!"
3. Click "Check Password"
4. Wait for results

Expected Result:
✅ Strength shown (Weak/Medium/Strong)
✅ Toast shows: "✅ Result saved to history"
✅ New entry in ActivityHistory
✅ Shows status (not actual password)
```

### Test 2.5 - History Persistence After Refresh
```
Status: Authenticated (with scans already saved)
Steps:
1. View ActivityHistory (see saved scans)
2. Press F5 or Cmd+R to refresh page
3. Look at ActivityHistory again

Expected Result:
✅ All scans still visible after refresh
✅ Same number of entries as before
✅ No data lost
✅ Order maintained (most recent first)
```

### Test 2.6 - Logout Clears UI
```
Status: Authenticated (viewing history)
Steps:
1. View ActivityHistory
2. Click profile dropdown → Logout
3. Confirm logout
4. Navigate back to /scanning

Expected Result:
✅ Redirected to home page
✅ When returning to /scanning:
   - Login CTA visible
   - ActivityHistory either hidden or empty
   - Can still scan as guest
```

---

## ✅ Test Suite 3: Data Preservation Across Tabs

### Test 3.1 - URL Data Persists
```
Steps:
1. URL tab: Enter "https://example.com"
2. Click "Analyze URL"
3. Results show
4. Click Email tab
5. URL field is empty (expected, different tab)
6. Click URL tab again

Expected Result:
✅ URL field still shows: "https://example.com"
✅ Results still visible
✅ No need to re-scan
```

### Test 3.2 - Email Data Persists
```
Steps:
1. Email tab: Enter "test@example.com"
2. Click "Check Breach"
3. Results show
4. Click File tab
5. Switch back to Email

Expected Result:
✅ Email field still shows: "test@example.com"
✅ Results still visible
✅ Data preserved
```

### Test 3.3 - File Data Persists
```
Steps:
1. File tab: Select a file (shows filename)
2. Click "Scan File"
3. Results show
4. Click Password tab
5. Switch back to File

Expected Result:
✅ File still selected (shows filename)
✅ Results still visible
✅ Can click scan again without re-selecting
```

### Test 3.4 - Password Data Persists
```
Steps:
1. Password tab: Enter a password
2. Click "Check Password"
3. Results show
4. Switch to URL tab
5. Switch back to Password

Expected Result:
✅ Password field still filled
✅ Results still visible
✅ Data preserved (note: password field shows dots, not actual password)
```

### Test 3.5 - Rapid Tab Switching
```
Steps:
1. Enter data in URL tab → Analyze
2. Immediately switch to Email
3. Enter email → Analyze
4. Rapidly switch: URL → Email → File → Password → URL

Expected Result:
✅ No crashes
✅ Each tab shows its own data
✅ No data mixed between tabs
✅ Smooth switching (no flickering)
```

---

## ✅ Test Suite 4: Reset Buttons

### Test 4.1 - URL Reset Button
```
Steps:
1. URL tab: Enter "https://example.com"
2. Look for buttons: [Analyze URL] and [Reset]
3. Click "Analyze URL"
4. See results
5. Click [Reset] button

Expected Result:
✅ [Reset] button appears after entering URL
✅ After reset: URL field empty, results gone
✅ Toast shows: "URL scan cleared"
✅ Ready for new scan
```

### Test 4.2 - Email Reset Button
```
Steps:
1. Email tab: Enter "test@example.com"
2. Look for [Reset] button next to [Check Breach]
3. Click "Check Breach"
4. See results
5. Click [Reset]

Expected Result:
✅ [Reset] button visible
✅ Email field cleared, results gone
✅ Toast confirms reset
```

### Test 4.3 - File Reset Button
```
Steps:
1. File tab: Select a file
2. Look for [Reset] button next to [Scan File]
3. Click "Scan File"
4. Results show
5. Click [Reset]

Expected Result:
✅ File selection cleared
✅ Upload area empty again
✅ Results gone
✅ Toast shows: "File scan cleared"
```

### Test 4.4 - Password Reset Button
```
Steps:
1. Password tab: Enter a password
2. Look for [Reset] button next to [Check Password]
3. Click "Check Password"
4. See strength results
5. Click [Reset]

Expected Result:
✅ Password field empty
✅ Results gone
✅ Toast confirms
```

### Test 4.5 - Reset Button Visibility
```
Steps:
1. URL tab: Check if [Reset] button exists without input
2. Enter a URL
3. Check if [Reset] appears
4. Click Reset
5. Check if [Reset] disappears

Expected Result:
✅ [Reset] NOT visible when field empty
✅ [Reset] appears after entering data
✅ [Reset] disappears after reset
✅ Smart visibility based on field state
```

### Test 4.6 - Mobile Reset Button
```
Status: Mobile device or mobile viewport
Steps:
1. Any tab with data
2. Look at reset button
3. Compare with Analyze/Check/Scan button

Expected Result:
✅ Reset button shows ICON ONLY (↻)
✅ [Analyze]/[Check]/[Scan] buttons show full text
✅ On desktop: both show full text
✅ No label truncation on mobile
```

---

## ✅ Test Suite 5: Guest vs Authenticated

### Test 5.1 - Guest Can Scan
```
Status: Not logged in (guest)
Steps:
1. Perform URL scan
2. Perform email scan
3. Try file scan
4. Try password scan

Expected Result:
✅ All scans work without login
✅ Each shows results
✅ Toast: "Guest scan (not saved...)"
✅ No errors
```

### Test 5.2 - Guest History Not Saved
```
Status: Not logged in (guest)
Steps:
1. Perform multiple scans (URL, email, file, password)
2. Each should show "Guest scan..." message
3. Look at ActivityHistory section
4. Or scroll down past scanning sections

Expected Result:
✅ ActivityHistory shows: "Log in to save activity and review history..."
✅ NOT showing the guest scans performed
✅ Properly informs users scans aren't saved
```

### Test 5.3 - After Login, History Includes Only Logged-In Scans
```
Status: Performed guest scans, then logged in
Steps:
1. As guest: Perform URL scan
2. Login 
3. Navigate back to /scanning
4. Look at ActivityHistory

Expected Result:
✅ Guest scans NOT in history
✅ Only shows scans done after login
✅ Confirms guest scans truly aren't saved
```

---

## ✅ Test Suite 6: Error Handling

### Test 6.1 - Invalid URL
```
Steps:
1. URL tab
2. Enter: "not a valid url"
3. Click "Analyze URL"

Expected Result:
✅ Either handles gracefully or shows error toast
✅ No crash
✅ Can try again
```

### Test 6.2 - Invalid Email
```
Steps:
1. Email tab
2. Enter: "not.an.email"
3. Click "Check Breach"

Expected Result:
✅ May show warning or process anyway
✅ No crash
✅ Results display or error shown
```

### Test 6.3 - Large File
```
Steps:
1. File tab
2. Select a large file (10+ MB)
3. Click "Scan File"

Expected Result:
✅ Progress shows
✅ Completes without crash
✅ Results display
```

### Test 6.4 - Network Error Simulation
```
Steps:
1. Open DevTools → Network tab
2. Set throttling to "Offline"
3. Try to perform a scan while authenticated
4. Watch error handling

Expected Result:
✅ Graceful error handling
✅ Clear message to user
✅ Toast shows error if applicable
✅ Can retry
```

---

## ✅ Test Suite 7: Mobile & Responsive

### Test 7.1 - Small Screen (Mobile)
```
Device: Phone or mobile viewport (375px width)
Steps:
1. View all tabs - should be stacked or scrollable
2. Buttons should be full width or stacked
3. Input fields should fit
4. Results should be readable

Expected Result:
✅ Single column layout
✅ All content readable
✅ No overflow or truncation
✅ Touch-friendly buttons
```

### Test 7.2 - Medium Screen (Tablet)
```
Device: Tablet or 768px viewport
Steps:
1. View scanning sections
2. Two buttons per row if possible
3. Results formatting

Expected Result:
✅ Good use of space
✅ Readable and accessible
✅ Buttons arranged logically
```

### Test 7.3 - Large Screen (Desktop)
```
Device: Desktop or large viewport (1440px+)
Steps:
1. Full layout with proper spacing
2. Reset button shows full text
3. History shown with full details

Expected Result:
✅ Full text visible
✅ All details shown
✅ Professional appearance
```

---

## ✅ Test Suite 8: Performance & UX

### Test 8.1 - Smooth Animations
```
Steps:
1. Perform a scan
2. Watch results fade in
3. Switch tabs
4. Click reset

Expected Result:
✅ Smooth fade-in animations
✅ No jank or stuttering
✅ Professional feel
```

### Test 8.2 - Toast Notifications
```
Steps:
1. Perform scans (authenticated and guest)
2. Click reset buttons
3. Switch views
4. Logout

Expected Result:
✅ Toasts appear at expected times
✅ Messages are clear
✅ Auto-dismiss after few seconds
✅ Multiple toasts stack properly
```

### Test 8.3 - No Console Errors
```
Steps:
1. Open DevTools → Console tab
2. Perform various operations:
   - Login/Logout
   - Multiple scans
   - Tab switches
   - Resets
   - Page refresh

Expected Result:
✅ No red error messages
✅ No warnings
✅ Clean console
```

---

## 📊 Summary Table

| Test Suite | Tests | Expected | Status |
|----------|-------|----------|--------|
| Authentication UI | 3 | PASS | [ ] |
| History Saving | 6 | PASS | [ ] |
| Data Persistence | 5 | PASS | [ ] |
| Reset Buttons | 6 | PASS | [ ] |
| Guest vs Authenticated | 3 | PASS | [ ] |
| Error Handling | 4 | PASS | [ ] |
| Mobile & Responsive | 3 | PASS | [ ] |
| Performance & UX | 3 | PASS | [ ] |
| **TOTAL** | **33** | **PASS** | **[ ]** |

---

## 🐛 Known Issues (None Expected)

If any issues found during testing:
1. Document the exact steps to reproduce
2. Note the expected vs actual result
3. Check browser console for errors
4. Try clearing browser cache
5. Report with screenshot if possible

---

## ✅ Sign-Off Checklist

- [ ] All 33 tests pass
- [ ] No console errors
- [ ] Mobile tested
- [ ] Desktop tested
- [ ] Guest mode works
- [ ] Authenticated mode works
- [ ] History saves correctly
- [ ] Data persists across tabs
- [ ] Reset buttons work
- [ ] Ready for production

---

## 🚀 Next Steps After Testing

1. **If all tests pass**: Ready for deployment ✅
2. **If issues found**: Document and fix
3. **Monitor**: Watch for user issues in production
4. **Gather feedback**: Collect user comments
5. **Iterate**: Plan improvements based on feedback

---

## 📞 Questions During Testing?

Refer to:
- `SCANNING_SYSTEM_IMPROVEMENTS.md` - Detailed technical guide
- `SCANNING_QUICK_START.md` - Quick reference
- Component code in `src/components/dashboard/` - Implementation details

---

## ✨ Ready to Test!

All systems in place. Follow the test suites above and mark each test as complete. Good luck! 🎉
