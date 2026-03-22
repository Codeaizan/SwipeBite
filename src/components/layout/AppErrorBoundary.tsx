"use client"

import React from 'react';

interface AppErrorBoundaryProps {
  children: React.ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

export class AppErrorBoundary extends React.Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  constructor(props: AppErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('Unhandled app error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 bg-[#0f0f0f] flex flex-col items-center justify-center p-8 text-center">
          <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
          <p className="text-[#888] mb-6">Please refresh and try again.</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white font-bold px-6 py-3 rounded-xl"
          >
            Reload App
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
