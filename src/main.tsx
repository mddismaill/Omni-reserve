import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import OAuthConsent from './pages/OAuthConsent.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import { installMonitoring } from './lib/monitoring';
import { initAuthSync } from './lib/auth';
import { Toaster } from 'sonner';
import './lib/i18n';
import './index.css';

// Install global error + performance monitoring BEFORE any other fetch wrapper
// so the monitoring wrapper wraps the native fetch, and the auth wrapper wraps
// the monitored fetch. Both layers cooperate.
installMonitoring();

// Kick off Supabase session hydration ASAP so the access token is mirrored
// into localStorage before any /api/* fetch fires below.
void initAuthSync();

// Attach the auth token from localStorage to every same-origin /api/* request
// so that server-side authorization (session-based) can identify the caller.
(() => {
  const originalFetch = window.fetch.bind(window);
  const authFetch = (input: RequestInfo | URL, init?: RequestInit) => {
    try {
      const url = typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
      const isApi = url.startsWith('/api/') || url.includes(`${window.location.origin}/api/`);
      if (isApi) {
        const token = localStorage.getItem('auth_token');
        if (token) {
          const headers = new Headers(init?.headers || (input instanceof Request ? input.headers : undefined));
          if (!headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);
          return originalFetch(input, { ...(init || {}), headers });
        }
      }
    } catch { /* fall through */ }
    return originalFetch(input, init);
  };

  const desc = Object.getOwnPropertyDescriptor(window, 'fetch');
  const isWritable = !desc || desc.writable || desc.set || desc.configurable;

  if (isWritable) {
    try {
      Object.defineProperty(window, 'fetch', {
        value: authFetch,
        configurable: true,
        writable: true,
        enumerable: true
      });
    } catch (e) {
      try {
        window.fetch = authFetch;
      } catch (err) {
        console.error("Failed to redefine window.fetch in main:", err);
      }
    }
  } else {
    console.warn("window.fetch is read-only and non-configurable. Skipping auth fetch override.");
  }
})();

const isConsentRoute = window.location.pathname === '/.lovable/oauth/consent';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      {isConsentRoute ? <OAuthConsent /> : <App />}
      <Toaster position="top-right" richColors closeButton theme="dark" />
    </ErrorBoundary>
  </StrictMode>,
);
