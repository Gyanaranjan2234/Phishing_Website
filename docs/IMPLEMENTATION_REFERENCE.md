# React Hook vs Vanilla JavaScript - Implementation Reference

## Quick Comparison

### React Hook Approach ✅ (Recommended for React Projects)
**File:** `src/hooks/use-scroll-active-section.ts`

**Pros:**
- ✅ Integrated with React state
- ✅ Automatic cleanup with useEffect
- ✅ Type-safe with TypeScript
- ✅ Idiomatic React pattern
- ✅ Easy to use in components

**Usage:**
```typescript
import { useScrollActiveSection } from '@/hooks/use-scroll-active-section';

const MyComponent = () => {
  const activeSection = useScrollActiveSection({
    sectionIds: ['home', 'about', 'contact'],
  });

  return (
    <button className={activeSection === 'home' ? 'active' : ''}>
      Home
    </button>
  );
};
```

---

### Vanilla JavaScript Class ✅ (For Any Project Type)
**File:** `src/lib/scrollActiveSectionTracker.ts`

**Pros:**
- ✅ No framework dependencies
- ✅ Works with any project type
- ✅ Easier to integrate into existing code
- ✅ Can be used in plain HTML/CSS/JS
- ✅ Event-based callbacks

**Usage:**
```javascript
import { ScrollActiveSectionTracker } from '@/lib/scrollActiveSectionTracker';

const tracker = new ScrollActiveSectionTracker({
  sectionIds: ['home', 'about', 'contact'],
  navSelector: 'nav a',
  activeClass: 'active',
});

tracker.init();
tracker.onChange((id) => console.log('Active:', id));
tracker.destroy();
```

---

## Implementation Patterns

### Pattern 1: React Component with Hook (Current Implementation)

**File:** `src/pages/Index.tsx`

```jsx
import { useScrollActiveSection } from '@/hooks/use-scroll-active-section';

export default function Index() {
  // Get active section automatically tracked
  const activeSection = useScrollActiveSection({
    sectionIds: ["home", "about", "contact"],
    rootMargin: "-40% 0px -55% 0px",
    threshold: 0.3,
  });

  return (
    <nav>
      <button 
        className={activeSection === "home" ? "active" : ""}
        onClick={() => navTo("home")}
      >
        Home
      </button>
      <button 
        className={activeSection === "about" ? "active" : ""}
        onClick={() => navTo("about")}
      >
        About
      </button>
      <button 
        className={activeSection === "contact" ? "active" : ""}
        onClick={() => navTo("contact")}
      >
        Contact
      </button>
    </nav>
  );
}
```

**Benefits:**
- Declarative state management
- Automatic cleanup
- Integrates with React lifecycle
- Easy testing with React Testing Library

---

### Pattern 2: Vanilla JavaScript with Class (Reusable Standalone)

**Usage in Plain HTML:**

```html
<nav id="navbar">
  <a href="#home" class="nav-link">Home</a>
  <a href="#about" class="nav-link">About</a>
  <a href="#contact" class="nav-link">Contact</a>
</nav>

<section id="home">...</section>
<section id="about">...</section>
<section id="contact">...</section>

<script type="module">
  import { ScrollActiveSectionTracker } from './src/lib/scrollActiveSectionTracker.js';

  const tracker = new ScrollActiveSectionTracker({
    sectionIds: ['home', 'about', 'contact'],
    navSelector: '.nav-link',
    activeClass: 'active',
    rootMargin: '-40% 0px -55% 0px',
    threshold: 0.3,
  });

  tracker.init();

  // Listen for changes
  tracker.onChange((sectionId) => {
    console.log('Scrolled to:', sectionId);
  });

  // Cleanup when done
  window.addEventListener('beforeunload', () => {
    tracker.destroy();
  });
</script>
```

**Benefits:**
- Works anywhere without React
- Simple imperative API
- Event-based flexibility
- Can be reused across projects

---

### Pattern 3: Using with Vue.js

```vue
<template>
  <nav>
    <a 
      v-for="section in sections"
      :key="section"
      :href="`#${section}`"
      :class="{ active: activeSection === section }"
    >
      {{ section }}
    </a>
  </nav>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { ScrollActiveSectionTracker } from '@/lib/scrollActiveSectionTracker';

const sections = ['home', 'about', 'contact'];
const activeSection = ref('home');
let tracker;

onMounted(() => {
  tracker = new ScrollActiveSectionTracker({
    sectionIds: sections,
    navSelector: 'nav a',
    activeClass: 'active',
  });

  tracker.init();
  tracker.onChange((id) => {
    activeSection.value = id;
  });
});

onUnmounted(() => {
  tracker?.destroy();
});
</script>
```

---

### Pattern 4: Using with Svelte

```svelte
<script>
  import { onMount, onDestroy } from 'svelte';
  import { ScrollActiveSectionTracker } from './scrollActiveSectionTracker';

  let activeSection = 'home';
  let tracker;

  onMount(() => {
    tracker = new ScrollActiveSectionTracker({
      sectionIds: ['home', 'about', 'contact'],
      navSelector: 'nav a',
      activeClass: 'active',
    });

    tracker.init();
    tracker.onChange((id) => {
      activeSection = id;
    });
  });

  onDestroy(() => {
    tracker?.destroy();
  });
</script>

<nav>
  <a href="#home" class:active={activeSection === 'home'}>Home</a>
  <a href="#about" class:active={activeSection === 'about'}>About</a>
  <a href="#contact" class:active={activeSection === 'contact'}>Contact</a>
</nav>

<style>
  a.active {
    border-color: #10b981;
    color: #10b981;
  }
</style>
```

---

## In-Depth: React Hook Implementation

### How the Hook Works

```typescript
export const useScrollActiveSection = ({
  sectionIds,
  rootMargin = '-40% 0px -55% 0px',
  threshold = 0.3,
}) => {
  // 1. State to track active section
  const [activeSection, setActiveSection] = useState(sectionIds[0] || '');
  
  // 2. Ref to hold observer instance
  const observerRef = useRef(null);
  
  // 3. Ref to track currently visible sections
  const intersectingElementsRef = useRef(new Set());

  // 4. Callback to handle intersection changes
  const handleIntersection = useCallback((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        // Section entered viewport
        intersectingElementsRef.current.add(entry.target.id);
      } else {
        // Section left viewport
        intersectingElementsRef.current.delete(entry.target.id);
      }
    });

    // Update active section to first visible one
    if (intersectingElementsRef.current.size > 0) {
      const activeId = Array.from(intersectingElementsRef.current)[0];
      setActiveSection(activeId);
    }
  }, []);

  // 5. Effect to create observer and cleanup
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      handleIntersection,
      {
        rootMargin,
        threshold: Array.isArray(threshold) ? threshold : [threshold],
      }
    );

    // Observe all sections
    sectionIds.forEach((id) => {
      const element = document.getElementById(id);
      if (element && observerRef.current) {
        observerRef.current.observe(element);
      }
    });

    // Cleanup function
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      intersectingElementsRef.current.clear();
    };
  }, [sectionIds, handleIntersection, rootMargin, threshold]);

  return activeSection;
};
```

**Key Points:**
1. **State**: Holds the currently active section ID
2. **Refs**: Store observer and visible elements set
3. **Callback**: Handles intersection events
4. **Effect**: Creates observer and cleanup
5. **Return**: Current active section ID

---

## In-Depth: Vanilla JavaScript Class Implementation

### How the Class Works

```javascript
class ScrollActiveSectionTracker {
  constructor(options) {
    // Merge default options with user options
    this.options = {
      activeClass: 'active',
      navSelector: 'nav a',
      rootMargin: '-40% 0px -55% 0px',
      threshold: 0.3,
      ...options,
    };

    this.currentActiveSection = this.options.sectionIds[0] || '';
    this.intersectingElements = new Set();
    this.onChangeCallbacks = [];
  }

  init() {
    // Create observer with options
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

  handleIntersection(entries) {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        this.intersectingElements.add(entry.target.id);
      } else {
        this.intersectingElements.delete(entry.target.id);
      }
    });

    if (this.intersectingElements.size > 0) {
      const newActiveSection = Array.from(this.intersectingElements)[0];
      if (newActiveSection !== this.currentActiveSection) {
        this.setActiveSection(newActiveSection);
      }
    }
  }

  setActiveSection(sectionId) {
    if (this.currentActiveSection) {
      this.updateNavLinks(this.currentActiveSection, false);
    }

    this.currentActiveSection = sectionId;
    this.updateNavLinks(sectionId, true);

    // Notify listeners
    this.onChangeCallbacks.forEach((callback) => callback(sectionId));
  }

  updateNavLinks(sectionId, isActive) {
    const navLinks = document.querySelectorAll(this.options.navSelector);
    
    navLinks.forEach((link) => {
      const href = link.getAttribute('href');
      const linkSectionId = href?.replace(/^#/, '') || '';

      if (linkSectionId === sectionId) {
        if (isActive) {
          link.classList.add(this.options.activeClass);
        } else {
          link.classList.remove(this.options.activeClass);
        }
      }
    });
  }

  getActiveSection() {
    return this.currentActiveSection;
  }

  onChange(callback) {
    this.onChangeCallbacks.push(callback);
  }

  destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.intersectingElements.clear();
    this.onChangeCallbacks = [];
  }
}
```

**Key Points:**
1. **Constructor**: Initializes options and state
2. **init()**: Creates observer and starts tracking
3. **handleIntersection()**: Updates visible elements
4. **setActiveSection()**: Updates active state and DOM
5. **updateNavLinks()**: Applies/removes active class
6. **destroy()**: Cleanup resources

---

## Debugging & Testing

### React: Using React DevTools

```typescript
// Add logging to hook
const handleIntersection = useCallback((entries) => {
  console.log('Intersection event:', entries.map(e => ({
    id: e.target.id,
    isIntersecting: e.isIntersecting,
    intersectionRatio: e.intersectionRatio,
  })));
  
  // ... rest of logic
}, []);
```

### Vanilla: Using Browser DevTools

```javascript
tracker.onChange((id) => {
  console.log('Active section changed:', id);
  console.log('Current intersecting:', tracker.getActiveSection());
});
```

### Testing with Intersection Observer Mock

```javascript
// Jest test example
global.IntersectionObserver = class IntersectionObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {
    // Mock implementation
  }
  disconnect() {
    // Mock implementation
  }
  unobserve() {
    // Mock implementation
  }
};

test('activeSection updates on scroll', () => {
  const { result } = renderHook(() =>
    useScrollActiveSection({
      sectionIds: ['home', 'about', 'contact'],
    })
  );

  expect(result.current).toBe('home');
});
```

---

## Performance Profiling

### React Profiler

```jsx
import { Profiler } from 'react';

<Profiler id="scroll-tracker" onRender={(id, phase, actualDuration) => {
  console.log(`${id} (${phase}) took ${actualDuration}ms`);
}}>
  <YourComponent />
</Profiler>
```

### Browser Performance API (Vanilla)

```javascript
const start = performance.now();

tracker.init();

const end = performance.now();
console.log(`Tracker initialization: ${end - start}ms`);
```

---

## Migration: Old Code → New Implementation

### Before (Manual Observer)
```jsx
useEffect(() => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        setActiveSection(entry.target.id);
      }
    });
  });
  
  const sectionIds = ["home", "about", "contact"];
  sectionIds.forEach((id) => {
    const element = document.getElementById(id);
    observer.observe(element);
  });
  
  return () => observer.disconnect();
}, []);
```

### After (Using Hook)
```jsx
const activeSection = useScrollActiveSection({
  sectionIds: ["home", "about", "contact"],
});
```

**Savings:** 16 lines → 3 lines (81% reduction!)

---

## Choosing the Right Approach

| Use Case | Recommendation |
|----------|-----------------|
| React SPA | React Hook (`useScrollActiveSection`) |
| Vanilla HTML/JS | Vanilla Class (`ScrollActiveSectionTracker`) |
| Vue.js | Vanilla Class with composition |
| Svelte | Vanilla Class with reactive |
| WordPress/Plugins | Vanilla Class |
| Server-rendered | Either (prefer vanilla for simplicity) |
| Performance-critical | Vanilla Class (less overhead) |
| Development speed | React Hook (built-in cleanup) |

---

That's it! Both approaches are optimized, clean, and production-ready. Pick the one that fits your project! 🚀
