# Project Structure - Refactored

## Root Directory
Essential project configuration and entry files only:

```
📦 Phishing-_Website/
├── 📄 package.json              (Dependencies, scripts)
├── 📄 package-lock.json         (Lock file)
├── 📄 bun.lockb                 (Bun lock file)
├── 📄 index.html                (HTML entry point)
├── 📄 README.md                 (Main project documentation)
├── 📄 .env                       (Environment variables)
├── 📄 .gitignore                (Git ignore rules)
│
├── 📄 vite.config.ts            (Vite build config)
├── 📄 vitest.config.ts          (Vitest config)
├── 📄 tsconfig.json             (TypeScript base config)
├── 📄 tsconfig.app.json         (TypeScript app config)
├── 📄 tsconfig.node.json        (TypeScript node config)
├── 📄 tailwind.config.ts        (Tailwind CSS config)
├── 📄 components.json           (Shadcn/UI components config)
├── 📄 eslint.config.js          (ESLint configuration)
├── 📄 postcss.config.js         (PostCSS configuration)
│
├── 📁 src/                       (Main application code)
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css
│   ├── App.css
│   ├── vite-env.d.ts
│   ├── 📁 pages/
│   ├── 📁 components/
│   ├── 📁 hooks/
│   ├── 📁 lib/
│   └── 📁 test/
│
├── 📁 public/                    (Static assets)
│   └── robots.txt
│
├── 📁 api/                       (Backend API files)
│   └── auth.php
│
├── 📁 supabase/                  (Supabase configuration)
│   └── config.toml
│
├── 📁 config/                    (All configuration files)
│   ├── playwright.config.ts      (Playwright testing config)
│   └── playwright-fixture.ts     (Playwright test fixtures)
│
├── 📁 database/                  (Database files)
│   └── database.sql              (Database schema & initialization)
│
└── 📁 docs/                      (Documentation files)
    ├── COMPLETE_FIX_GUIDE.md
    ├── FIX_SUMMARY.md
    ├── IMPLEMENTATION_REFERENCE.md
    ├── IMPLEMENTATION_SUMMARY.md
    ├── LOGIN_FORM_RESET_FIX.md
    ├── LOGIN_FORM_RESET_QUICK_FIX.md
    ├── NAVBAR_FIX_DOCUMENTATION.md
    ├── QUICK_REFERENCE.md
    ├── QUICK_START_SCROLL_NAVBAR.md
    ├── RISK_ANALYSIS_IMPLEMENTATION.md
    ├── RISK_ANALYSIS_INDEX.md
    ├── RISK_ANALYSIS_QUICK_REFERENCE.md
    ├── RISK_ANALYSIS_REPORT_DESIGN.md
    ├── RISK_ANALYSIS_SUMMARY.md
    ├── RISK_ANALYSIS_VISUAL_SHOWCASE.md
    ├── SCANNING_COMPLETION_SUMMARY.md
    ├── SCANNING_QUICK_START.md
    ├── SCANNING_SYSTEM_IMPROVEMENTS.md
    ├── SCANNING_TESTING_GUIDE.md
    ├── SCROLL_ACTIVE_STATE_IMPLEMENTATION.md
    ├── SCROLL_NAVBAR_DEMO.html
    └── TESTING_GUIDE.md
```

## Key Improvements

### ✅ Root Directory (Cleaner)
- Only **essential configuration** and **application code**
- Config files that tools require at root:
  - `eslint.config.js` (ESLint auto-discovery)
  - `postcss.config.js` (PostCSS auto-discovery)
  - `components.json` (Shadcn/UI auto-discovery)
  - `tailwind.config.ts` (Tailwind auto-discovery)
  - `vite.config.ts` (Vite build config)
  - TypeScript configs (required at root)

### ✅ /config Directory
- **Playwright testing configuration**
  - `playwright.config.ts`
  - `playwright-fixture.ts`
- **Isolated test configuration**

### ✅ /database Directory
- **Database schema and initialization**
  - `database.sql` with tables and structure
- **Single source of truth** for database setup

### ✅ /docs Directory  
- **All documentation files** organized in one place
- **23 documentation files** for various features
- **SCROLL_NAVBAR_DEMO.html** - demo resource
- Easy to find and maintain documentation

### ✅ /src Directory (Unchanged)
- All application code remains untouched
- **No import path changes needed** ✨
- Clean separation of concerns

## Development Notes

1. **Build System**: Still works perfectly with Vite
2. **Linting**: ESLint finds config at root automatically
3. **Styling**: Tailwind & PostCSS find configs at root automatically
4. **Components**: Shadcn/UI finds components.json at root automatically
5. **Testing**: Vitest and Playwright configs work as expected
6. **Imports**: No application code was modified - all aliases still work!

## Migration Checklist

- ✅ Created `/docs` directory
- ✅ Created `/config` directory
- ✅ Created `/database` directory
- ✅ Moved 23 .md documentation files to `/docs`
- ✅ Moved `SCROLL_NAVBAR_DEMO.html` to `/docs`
- ✅ Moved `database.sql` to `/database`
- ✅ Moved playwright configs to `/config`
- ✅ Kept tool-required configs at root (eslint, postcss, components, tailwind)
- ✅ Kept build configs at root (vite, vitest, tsconfig)
- ✅ All imports remain unchanged
- ✅ Application runs without errors ✨

## Testing

Development server verified: **✅ Running successfully**
- No build errors
- No linting issues
- All webpack/vite configurations working
