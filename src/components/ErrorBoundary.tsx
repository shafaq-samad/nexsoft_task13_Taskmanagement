import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  declare props: Readonly<ErrorBoundaryProps>;
  declare state: ErrorBoundaryState;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Unhandled UI error', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 text-slate-900">
          <div className="max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h1 className="text-lg font-bold">Something went wrong</h1>
            <p className="mt-2 text-sm text-slate-600">
              The app hit an unexpected UI error. Refresh the page, and if the issue persists, check the console.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
