import { useEffect, useState, useRef, useCallback } from 'react';

interface UseScrollActiveSectionOptions {
  sectionIds: string[];
  rootMargin?: string;
  threshold?: number | number[];
}

interface UseScrollActiveSectionReturn {
  activeSection: string;
  setActiveSection: (sectionId: string) => void;
}

/**
 * Custom hook for tracking active section based on scroll position using Intersection Observer API
 * Strict section detection: picks only the MOST visible section (highest intersection ratio)
 * Manual override cooldown prevents observer override during user clicks (500ms)
 * Ensures clean, flicker-free navbar updates
 */
export const useScrollActiveSection = ({
  sectionIds,
  rootMargin = '-35% 0px -65% 0px',
  threshold = [0.1, 0.5],
}: UseScrollActiveSectionOptions): UseScrollActiveSectionReturn => {
  const [activeSection, setActiveSectionState] = useState<string>(sectionIds[0] || '');
  const observerRef = useRef<IntersectionObserver | null>(null);
  const intersectionMapRef = useRef<Map<string, number>>(new Map());
  const lastActiveSectionRef = useRef<string>(sectionIds[0] || '');
  const manualOverrideTimeRef = useRef<number>(0);
  const MANUAL_OVERRIDE_COOLDOWN = 500; // ms - cooldown after manual clicks

  // Wrapper function to update state with manual override tracking
  const setActiveSection = useCallback((sectionId: string) => {
    if (sectionId !== lastActiveSectionRef.current) {
      setActiveSectionState(sectionId);
      lastActiveSectionRef.current = sectionId;
      manualOverrideTimeRef.current = Date.now(); // Mark manual override time
    }
  }, []);

  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      // Skip update if in manual override cooldown
      const now = Date.now();
      if (now - manualOverrideTimeRef.current < MANUAL_OVERRIDE_COOLDOWN) {
        return;
      }

      let hasChanges = false;

      // Update intersection ratios for all entries
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const currentRatio = intersectionMapRef.current.get(entry.target.id) || 0;
          if (entry.intersectionRatio > currentRatio) {
            intersectionMapRef.current.set(entry.target.id, entry.intersectionRatio);
            hasChanges = true;
          }
        } else {
          // Section left viewport
          if (intersectionMapRef.current.has(entry.target.id)) {
            intersectionMapRef.current.delete(entry.target.id);
            hasChanges = true;
          }
        }
      });

      // Only update if changes occurred and at least one section is visible
      if (!hasChanges || intersectionMapRef.current.size === 0) return;

      // Find section with HIGHEST intersection ratio (most visible)
      let mostVisibleId = '';
      let maxRatio = 0;

      intersectionMapRef.current.forEach((ratio, id) => {
        if (ratio > maxRatio) {
          maxRatio = ratio;
          mostVisibleId = id;
        }
      });

      // Fallback: pick first visible from sectionIds array order
      if (!mostVisibleId) {
        const visibleIds = Array.from(intersectionMapRef.current.keys());
        mostVisibleId = sectionIds.find((id) => visibleIds.includes(id)) || '';
      }

      // Only update state if actually changed
      if (mostVisibleId && mostVisibleId !== lastActiveSectionRef.current) {
        setActiveSectionState(mostVisibleId);
        lastActiveSectionRef.current = mostVisibleId;
      }
    },
    [sectionIds]
  );

  useEffect(() => {
    // Create observer
    observerRef.current = new IntersectionObserver(handleIntersection, {
      rootMargin,
      threshold: Array.isArray(threshold) ? threshold : [threshold],
    });

    // Observe all sections
    sectionIds.forEach((id) => {
      const element = document.getElementById(id);
      if (element && observerRef.current) {
        observerRef.current.observe(element);
      }
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      intersectionMapRef.current.clear();
    };
  }, [sectionIds, handleIntersection, rootMargin, threshold]);

  return {
    activeSection,
    setActiveSection,
  };
};
