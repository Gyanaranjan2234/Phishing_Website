/**
 * Vanilla JavaScript Scroll-Based Active Section Tracker
 * Uses Intersection Observer API for smooth, performant scroll tracking
 * 
 * Usage:
 * const tracker = new ScrollActiveSectionTracker({
 *   sectionIds: ['home', 'about', 'contact'],
 *   navSelector: 'nav a',
 *   activeClass: 'active',
 *   rootMargin: '-35% 0px -65% 0px',
 *   threshold: [0.1, 0.5]
 * });
 * 
 * tracker.init();
 * 
 * // Get current active section
 * console.log(tracker.getActiveSection()); // returns section id
 * 
 * // Manually set active section (useful for click handling)
 * tracker.setActiveSection('about');
 * 
 * // Listen for changes
 * tracker.onChange((sectionId) => {
 *   console.log('Active section:', sectionId);
 * });
 * 
 * // Cleanup when done
 * tracker.destroy();
 */

interface ScrollActiveSectionTrackerOptions {
  sectionIds: string[];
  navSelector?: string; // CSS selector for nav links
  activeClass?: string; // Class to apply to active links
  rootMargin?: string;
  threshold?: number | number[];
}

class ScrollActiveSectionTracker {
  private options: Required<ScrollActiveSectionTrackerOptions>;
  private observer: IntersectionObserver | null = null;
  private intersectingElements: Set<string> = new Set();
  private currentActiveSection: string;
  private onChangeCallbacks: ((sectionId: string) => void)[] = [];
  private lastActiveSection: string = '';

  constructor(options: ScrollActiveSectionTrackerOptions) {
    this.options = {
      activeClass: 'active',
      navSelector: 'nav a',
      rootMargin: '-35% 0px -65% 0px',
      threshold: [0.1, 0.5],
      ...options,
    };

    this.currentActiveSection = this.options.sectionIds[0] || '';
    this.lastActiveSection = this.currentActiveSection;
  }

  /**
   * Initialize the observer and start tracking
   */
  init(): void {
    this.observer = new IntersectionObserver(
      (entries) => this.handleIntersection(entries),
      {
        rootMargin: this.options.rootMargin,
        threshold: Array.isArray(this.options.threshold)
          ? this.options.threshold
          : [this.options.threshold],
      }
    );

    // Observe all sections
    this.options.sectionIds.forEach((id) => {
      const element = document.getElementById(id);
      if (element && this.observer) {
        this.observer.observe(element);
      }
    });
  }

  /**
   * Handle intersection changes
   */
  private handleIntersection(entries: Array<IntersectionObserverEntry>): void {
    let hasChanges = false;

    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        // Section entered viewport
        if (!this.intersectingElements.has(entry.target.id)) {
          this.intersectingElements.add(entry.target.id);
          hasChanges = true;
        }
      } else {
        // Section left viewport
        if (this.intersectingElements.has(entry.target.id)) {
          this.intersectingElements.delete(entry.target.id);
          hasChanges = true;
        }
      }
    });

    // Only update if there were changes
    if (hasChanges && this.intersectingElements.size > 0) {
      // Get the first intersecting element by order in sectionIds array
      const visibleSections = Array.from(this.intersectingElements);
      const sortedActive = this.options.sectionIds.find((id) =>
        visibleSections.includes(id)
      );

      if (sortedActive) {
        this.setActiveSection(sortedActive);
      }
    }
  }

  /**
   * Update active section and notify listeners
   */
  setActiveSection(sectionId: string): void {
    // Only update if section actually changed
    if (sectionId === this.lastActiveSection) {
      return;
    }

    // Remove active class from previous active link
    if (this.currentActiveSection) {
      this.updateNavLinks(this.currentActiveSection, false);
    }

    // Set new active section
    this.currentActiveSection = sectionId;
    this.lastActiveSection = sectionId;

    // Add active class to new active link
    this.updateNavLinks(sectionId, true);

    // Notify all listeners
    this.onChangeCallbacks.forEach((callback) => callback(sectionId));
  }

  /**
   * Update nav link active state - works with both anchor links and hrefs
   */
  private updateNavLinks(sectionId: string, isActive: boolean): void {
    const navLinks = document.querySelectorAll(this.options.navSelector) as NodeListOf<HTMLElement>;

    navLinks.forEach((link) => {
      // Match link href with section id
      const href = link.getAttribute('href') || link.getAttribute('data-section') || '';
      const linkSectionId = href.replace(/^#/, '') || '';

      if (linkSectionId === sectionId) {
        if (isActive) {
          link.classList.add(this.options.activeClass);
        } else {
          link.classList.remove(this.options.activeClass);
        }
      }
    });
  }

  /**
   * Get current active section
   */
  getActiveSection(): string {
    return this.currentActiveSection;
  }

  /**
   * Register callback for active section changes
   */
  onChange(callback: (sectionId: string) => void): void {
    this.onChangeCallbacks.push(callback);
  }

  /**
   * Stop tracking and cleanup resources
   */
  destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.intersectingElements.clear();
    this.onChangeCallbacks = [];
  }
}

// Export for use in browsers
if (typeof window !== 'undefined') {
  (window as any).ScrollActiveSectionTracker = ScrollActiveSectionTracker;
}

export { ScrollActiveSectionTracker };
export type { ScrollActiveSectionTrackerOptions };
