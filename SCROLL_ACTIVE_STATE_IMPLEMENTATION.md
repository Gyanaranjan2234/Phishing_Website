# Scroll-Based Active Navbar State Implementation

## Overview

This implementation provides automatic navbar active state tracking based on scroll position using the **Intersection Observer API**. The solution is optimized for smooth performance, prevents flickering during fast scrolling, and ensures only one link is active at a time.

## Files Created/Modified

### 1. **useScrollActiveSection.ts** (New Hook)
Location: `src/hooks/use-scroll-active-section.ts`

A custom React hook that manages scroll-based active section tracking using Intersection Observer API.

**Features:**
- ✅ Optimized Intersection Observer with configurable options
- ✅ Prevents flickering by tracking all intersecting elements
- ✅ Only one section active at a time
- ✅ Smooth performance with proper cleanup
- ✅ TypeScript support

**Usage in React:**
```typescript
import { useScrollActiveSection } from '@/hooks/use-scroll-active-section';

const activeSection = useScrollActiveSection({
  sectionIds: ['home', 'about', 'contact'],
  rootMargin: '-40% 0px -55% 0px',
  threshold: 0.3,
});

// Use activeSection state in your navbar
<button className={activeSection === 'home' ? 'active' : ''}>
  Home
</button>
```

### 2. **scrollActiveSectionTracker.ts** (Vanilla JS Utility)
Location: `src/lib/scrollActiveSectionTracker.ts`

A standalone vanilla JavaScript class that can be used without React for any project.

**Features:**
- ✅ Pure JavaScript (TypeScript-compiled)
- ✅ No external dependencies
- ✅ Event-based callbacks
- ✅ Automatic nav link class management
- ✅ Flexible configuration

**Usage in Vanilla JS:**
```javascript
const tracker = new ScrollActiveSectionTracker({
  sectionIds: ['home', 'about', 'contact'],
  navSelector: 'nav a',
  activeClass: 'active',
  rootMargin: '-40% 0px -55% 0px',
  threshold: 0.3
});

tracker.init();

// Listen for changes
tracker.onChange((sectionId) => {
  console.log('Now at:', sectionId);
});

// Get current section
const current = tracker.getActiveSection();

// Cleanup
tracker.destroy();
```

### 3. **Index.tsx** (Updated)
Location: `src/pages/Index.tsx`

**Changes:**
- Replaced manual Intersection Observer setup with the new `useScrollActiveSection` hook
- Removed state initialization for `activeSection` (now managed by hook)
- Removed manual observer creation/cleanup code
- Simplified scroll tracking logic
- Removed redundant `setActiveSection()` calls

**Navbar links now:**
```jsx
<button onClick={() => navTo("home")} 
  className={`px-3 py-1 rounded-lg border ${
    activeSection === "home" ? "border-primary text-primary" : "border-border"
  } hover:bg-card/70 transition`}>
  Home
</button>
```

## How It Works

### Intersection Observer API

The implementation leverages the **Intersection Observer API** for optimal performance:

1. **Intersection Detection**: Observes when each section enters/exits the viewport
2. **Performance**: Uses device's optimized intersection checking (offloads to browser)
3. **Configuration**:
   - `rootMargin: "-40% 0px -55% 0px"` - Triggers when section is 40% from top
   - `threshold: 0.3` - Triggers at 30% visibility
   - These settings ensure smooth transitions without flickering

### Preventing Flickering

The solution prevents flickering during fast scrolling by:

1. **Tracking Multiple Intersecting Elements**: Maintains a Set of currently visible sections
2. **Predictable Priority**: Always uses the first intersecting element as active
3. **State Batching**: Only updates state when active section actually changes
4. **Stable Configuration**: Observer created once with consistent configuration

## Sections Configuration

Current sections being tracked:
- **home** - Hero section with main content
- **about** - About/Features section
- **contact** - Contact form section

Scanning is a separate route (`/scanning`) and uses pathname-based detection instead of scroll.

## Configuration Options

### `useScrollActiveSection` (React Hook)

```typescript
interface UseScrollActiveSectionOptions {
  sectionIds: string[];        // Section IDs to track
  rootMargin?: string;         // Default: "-40% 0px -55% 0px"
  threshold?: number | number[]; // Default: 0.3
}
```

### `ScrollActiveSectionTracker` (Vanilla JS)

```typescript
interface ScrollActiveSectionTrackerOptions {
  sectionIds: string[];        // Section IDs to track
  navSelector?: string;        // CSS selector for nav links (default: 'nav a')
  activeClass?: string;        // Class to apply (default: 'active')
  rootMargin?: string;         // Default: "-40% 0px -55% 0px"
  threshold?: number | number[]; // Default: 0.3
}
```

## Performance Considerations

1. **Efficient Observation**: Browser handles intersection detection natively
2. **Minimal DOM Queries**: Observer set up once, not on every scroll
3. **Batch Updates**: Multiple intersection changes processed together
4. **Cleanup**: Proper observer disconnection prevents memory leaks
5. **Debounced State**: Only updates when active section actually changes

## Browser Support

Intersection Observer API is supported in:
- ✅ Chrome 51+
- ✅ Firefox 55+
- ✅ Safari 12.1+
- ✅ Edge 79+
- ✅ Modern browsers (>99% coverage)

For older browser support, consider using the [Intersection Observer polyfill](https://github.com/w3c/IntersectionObserver/tree/main/polyfill).

## Testing the Implementation

### HTML Structure Requirements

Each section needs:
1. A unique `id` attribute
2. Sufficient height to be scrollable

```jsx
<section id="home">
  {/* Content */}
</section>

<section id="about">
  {/* Content */}
</section>

<section id="contact">
  {/* Content */}
</section>
```

### Navbar Links

Each nav link should:
1. Have an `onClick` handler that scrolls to section
2. Use active section state for styling

```jsx
<button 
  onClick={() => navTo("home")}
  className={activeSection === "home" ? "active" : ""}
>
  Home
</button>
```

## Customization

### Adjusting Trigger Points

Modify `rootMargin` to change when sections become active:
- `"-40% 0px -55% 0px"` - Current (section becomes active 40% from top)
- `"-50% 0px -50% 0px"` - Centered trigger
- `"0px 0px -80% 0px"` - When section reaches top

### Adjusting Visibility Threshold

Modify `threshold` to change sensitivity:
- `0.3` - Triggers at 30% visibility
- `0.5` - Triggers at 50% visibility
- `[0.25, 0.75]` - Multiple thresholds

## Migration Guide

If you're updating existing code:

### Before (Manual Setup)
```jsx
useEffect(() => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        setActiveSection(entry.target.id);
      }
    });
  });
  
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
  sectionIds: ['home', 'about', 'contact'],
  rootMargin: '-40% 0px -55% 0px',
  threshold: 0.3,
});
```

## Troubleshooting

### Sections not tracking
- ✓ Verify section has correct `id` attribute
- ✓ Ensure section IDs match in hook configuration
- ✓ Check element is actually in DOM when hook initializes

### Active state not updating
- ✓ Check browser console for errors
- ✓ Verify threshold/rootMargin values are appropriate
- ✓ Ensure sections have sufficient height

### Flickering between sections
- ✓ This is prevented by Set-based tracking
- ✓ If still occurring, adjust `rootMargin` or `threshold`
- ✓ Ensure elements have sufficient spacing

## Future Enhancements

Possible improvements:
- Add animation/transition delays
- Support for nested/grouped sections
- Analytics tracking
- Mobile-optimized thresholds
- Smooth scroll polyfill for older browsers
