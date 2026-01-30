# WXT Browser Extension

## Overview

The browser extension is built with WXT framework, React 19, Tailwind CSS v4, shadcn/ui, and Zustand for state management. It uses Chrome's Side Panel API as the main UI.

## Project Structure

```
apps/extension/
├── src/
│   ├── entrypoints/               # Extension entry points
│   │   ├── background.ts          # Service worker (side panel control)
│   │   ├── sidepanel/             # Side panel UI (main)
│   │   │   ├── index.html
│   │   │   ├── main.tsx           # React entry
│   │   │   └── App.tsx            # Main component
│   │   └── content/               # Content scripts
│   │       ├── index.ts
│   │       └── ui/                # Content UI components
│   │
│   ├── components/                # React components
│   │   ├── ui/                    # Shadcn/UI components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── accordion.tsx
│   │   │   ├── sheet.tsx
│   │   │   ├── scroll-area.tsx
│   │   │   ├── switch.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── skeleton.tsx
│   │   │   └── spinner.tsx
│   │   └── layout/                # Layout components
│   │       ├── SidePanelLayout.tsx
│   │       ├── NavigationRail.tsx
│   │       ├── Header.tsx
│   │       └── Footer.tsx
│   │
│   ├── pages/                     # Page components
│   │   ├── Home.tsx
│   │   ├── History.tsx
│   │   ├── Settings.tsx
│   │   └── Help.tsx
│   │
│   ├── stores/                    # Zustand stores
│   │   ├── index.ts               # Store exports
│   │   ├── auth.store.ts          # Authentication state
│   │   └── app.store.ts           # App state
│   │
│   ├── hooks/                     # Custom React hooks
│   │   ├── use-theme.ts           # Theme hook
│   │   └── use-toast.ts           # Toast notifications
│   │
│   ├── providers/                 # React context providers
│   │   └── ThemeProvider.tsx
│   │
│   ├── lib/                       # Utilities
│   │   ├── utils.ts               # cn() helper
│   │   ├── api-client.ts          # Hono RPC client
│   │   ├── auth.ts                # Auth utilities
│   │   └── storage.ts             # Storage utilities
│   │
│   └── assets/                    # Static assets
│       └── main.css               # Tailwind imports
│
├── public/
│   └── icon.png                   # Extension icon
├── components.json                # shadcn/ui config
├── wxt.config.ts
├── tailwind.config.ts
├── package.json
└── tsconfig.json
```

## WXT Configuration

### wxt.config.ts

```typescript
import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  srcDir: 'src',
  manifest: {
    name: 'my-extension-project',
    description: 'Browser extension built with WXT and React',
    permissions: ['storage', 'sidePanel'],
    action: {},
    side_panel: {
      default_path: 'sidepanel.html',
    },
    host_permissions: ['http://localhost:8787/*'],
  },
});
```

## Side Panel UI

The extension uses Chrome's Side Panel API:

```typescript
// entrypoints/background.ts
export default defineBackground(() => {
  // Open side panel when clicking extension icon
  browser.action.onClicked.addListener(async (tab) => {
    if (tab.id) {
      await browser.sidePanel.open({ tabId: tab.id });
    }
  });
});
```

### Side Panel Entry

```typescript
// entrypoints/sidepanel/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '@/assets/main.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

## State Management with Zustand

Uses Zustand with chrome.storage.local persistence:

```typescript
// stores/auth.store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      login: async (email, password) => {
        const response = await api.api.auth.login.$post({ json: { email, password } });
        const { data } = await response.json();
        set({ user: data.user, accessToken: data.tokens.accessToken });
      },
      logout: () => set({ user: null, accessToken: null }),
    }),
    {
      name: 'auth-storage',
      storage: {
        getItem: async (name) => {
          const result = await chrome.storage.local.get(name);
          return result[name] ?? null;
        },
        setItem: async (name, value) => {
          await chrome.storage.local.set({ [name]: value });
        },
        removeItem: async (name) => {
          await chrome.storage.local.remove(name);
        },
      },
    }
  )
);
```

## API Integration with Hono RPC

Type-safe API calls using Hono client:

```typescript
// lib/api-client.ts
import { hc } from 'hono/client';
import type { AppType } from '@project/shared';

const API_URL = 'http://localhost:8787';

export const apiClient = hc<AppType>(API_URL);

// Usage with auth header
const response = await apiClient.api.users.me.$get({}, {
  headers: { Authorization: `Bearer ${token}` }
});
const { data } = await response.json();
```

## Theme Support

Dark/Light mode with system detection:

```typescript
// hooks/use-theme.ts
import { useEffect, useState } from 'react';

export function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const updateTheme = () => {
      const resolved = theme === 'system' 
        ? (mediaQuery.matches ? 'dark' : 'light')
        : theme;
      setResolvedTheme(resolved);
      document.documentElement.classList.toggle('dark', resolved === 'dark');
    };
    updateTheme();
    mediaQuery.addEventListener('change', updateTheme);
    return () => mediaQuery.removeEventListener('change', updateTheme);
  }, [theme]);

  return { theme, setTheme, resolvedTheme };
}
```

## UI Components

Built-in shadcn/ui components:

| Category | Components |
|----------|------------|
| Layout | SidePanelLayout, NavigationRail, Header, Footer |
| Core | Button, Tabs, Accordion, Sheet, ScrollArea |
| Form | Input, Textarea, Switch, Label |
| Feedback | Toast, Spinner, Skeleton |

### Adding Components

```bash
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add input
```

### Using Components

```tsx
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

function MyComponent() {
  return (
    <Button onClick={() => toast({ title: 'Success!' })}>
      Click me
    </Button>
  );
}
```

## Tailwind CSS v4 Setup

### assets/main.css

```css
@import "tailwindcss";
```

### Styling with CVA

```typescript
// components/ui/button.tsx
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        outline: 'border border-input hover:bg-accent',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 px-3',
        lg: 'h-11 px-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);
```

## Content Script

```typescript
// entrypoints/content/index.ts
export default defineContentScript({
  matches: ['*://*.example.com/*'],
  main() {
    console.log('Content script injected');
    // Inject floating UI, manipulate page, etc.
  },
});
```

## Development

```bash
# Dev mode (Chrome)
pnpm dev

# Dev mode (Firefox)
pnpm dev:firefox

# Build for production
pnpm build

# Package extension
pnpm zip
```

## Loading in Browser

### Chrome
1. Open `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `.output/chrome-mv3-dev/` folder

### Firefox
1. Open `about:debugging`
2. Click "This Firefox"
3. Click "Load Temporary Add-on"
4. Select `manifest.json` from `.output/firefox-mv3-dev/`

## Build Output

| Mode | Chrome | Firefox |
|------|--------|---------|
| Dev | `.output/chrome-mv3-dev/` | `.output/firefox-mv3-dev/` |
| Prod | `.output/chrome-mv3/` | `.output/firefox-mv3/` |
