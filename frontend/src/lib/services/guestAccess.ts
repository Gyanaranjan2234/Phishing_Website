// src/lib/guestAccess.ts
// Guest access control - limits scans for unauthenticated users with daily reset

const GUEST_SCAN_LIMIT = 3; // Maximum scans allowed for guests per day
const GUEST_SCAN_COUNT_KEY = "guest_scan_count";
const GUEST_LAST_SCAN_DATE_KEY = "guest_last_scan_date";

/**
 * Get today's date in YYYY-MM-DD format
 * @returns string representing today's date
 */
const getTodayDate = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Check if user is logged in
 * @returns true if user is authenticated, false if guest
 */
export const isUserLoggedIn = (): boolean => {
  const username = localStorage.getItem("username");
  const session = localStorage.getItem("user_session");
  return !!(username && session);
};

/**
 * Check and reset guest scan count if it's a new day
 */
const checkAndResetDaily = (): void => {
  const today = getTodayDate();
  const lastScanDate = localStorage.getItem(GUEST_LAST_SCAN_DATE_KEY);
  
  // If no date stored or date is different from today, reset
  if (!lastScanDate || lastScanDate !== today) {
    localStorage.setItem(GUEST_SCAN_COUNT_KEY, "0");
    localStorage.setItem(GUEST_LAST_SCAN_DATE_KEY, today);
  }
};

/**
 * Get current guest scan count (with daily reset check)
 * @returns number of scans performed by guest today
 */
export const getGuestScanCount = (): number => {
  checkAndResetDaily();
  const count = localStorage.getItem(GUEST_SCAN_COUNT_KEY);
  return count ? parseInt(count, 10) : 0;
};

/**
 * Increment guest scan count
 * @returns new scan count
 */
export const incrementGuestScanCount = (): number => {
  checkAndResetDaily(); // Ensure we're tracking today's count
  const currentCount = getGuestScanCount();
  const newCount = currentCount + 1;
  localStorage.setItem(GUEST_SCAN_COUNT_KEY, newCount.toString());
  localStorage.setItem(GUEST_LAST_SCAN_DATE_KEY, getTodayDate());
  return newCount;
};

/**
 * Check if guest can perform a scan
 * @returns { allowed: boolean, count: number, limit: number, message: string }
 */
export const canGuestScan = (): { 
  allowed: boolean; 
  count: number; 
  limit: number; 
  message: string;
} => {
  // If user is logged in, always allow
  if (isUserLoggedIn()) {
    return {
      allowed: true,
      count: 0,
      limit: GUEST_SCAN_LIMIT,
      message: "Authenticated user - unlimited scans"
    };
  }

  // Check guest scan count (with daily reset)
  const count = getGuestScanCount();
  
  if (count >= GUEST_SCAN_LIMIT) {
    return {
      allowed: false,
      count,
      limit: GUEST_SCAN_LIMIT,
      message: "Daily guest scan limit reached. Try again tomorrow or login."
    };
  }

  return {
    allowed: true,
    count,
    limit: GUEST_SCAN_LIMIT,
    message: `Guest scan ${count + 1} of ${GUEST_SCAN_LIMIT} (resets daily)`
  };
};

/**
 * Reset guest scan count (use after login or manually)
 */
export const resetGuestScanCount = (): void => {
  localStorage.removeItem(GUEST_SCAN_COUNT_KEY);
  localStorage.removeItem(GUEST_LAST_SCAN_DATE_KEY);
};

/**
 * Handle scan attempt - checks access and increments count if allowed
 * @returns { success: boolean, message: string }
 */
export const handleScanAttempt = (): { success: boolean; message: string } => {
  // Check if user is logged in
  if (isUserLoggedIn()) {
    return {
      success: true,
      message: "Authenticated user - scan allowed"
    };
  }

  // Guest user - check limit
  const { allowed, count, limit, message } = canGuestScan();

  if (!allowed) {
    return {
      success: false,
      message
    };
  }

  // Increment scan count
  const newCount = incrementGuestScanCount();
  
  return {
    success: true,
    message: `Guest scan ${newCount} of ${limit}`
  };
};
