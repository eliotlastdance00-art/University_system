import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

/* Provider tertibi möhüm:
   I18n     — `t()` hemme ýerde gerek
   Theme    — ThemeContext i18n-e garaşly däl, ýöne ToastProvider tema reňklerini ulanýar
   Toast    — NotificationsProvider / sahypalar toast çagyrýar
   Ui       — sidebar/palette ýagdaýy (Auth-a garaşly däl)
   Auth     — NotificationsProvider `user`-i okaýar
   Notifications — iň içki, diňe Auth-dan soň işleýär
*/
import { I18nProvider } from './i18n';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import { UiProvider } from './contexts/UiContext';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationsProvider } from './contexts/NotificationsContext';
import { ErrorBoundary } from './components/ui/ErrorBoundary';

import './styles/index.css';

const rootEl = document.getElementById('root');

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <ErrorBoundary>
      <I18nProvider>
        <ThemeProvider>
          <ToastProvider position="top">
            <UiProvider>
              <AuthProvider>
                <NotificationsProvider>
                  <App />
                </NotificationsProvider>
              </AuthProvider>
            </UiProvider>
          </ToastProvider>
        </ThemeProvider>
      </I18nProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
