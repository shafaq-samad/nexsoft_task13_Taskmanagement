import ErrorBoundary from './components/ErrorBoundary';
import { ActivityProvider } from './contexts/ActivityContext';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { ThemeProvider } from './contexts/ThemeContext';
import NotFound from './pages/NotFound';
import WorkspacePage from './pages/WorkspacePage';

export default function App() {
  const pathname = typeof window === 'undefined' ? '/' : window.location.pathname;

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ActivityProvider>
          <AuthProvider>
            <ToastProvider>
              {pathname === '/' ? <WorkspacePage /> : <NotFound />}
            </ToastProvider>
          </AuthProvider>
        </ActivityProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
