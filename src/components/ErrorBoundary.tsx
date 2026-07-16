import React from "react";
import { withTranslation, WithTranslation } from "react-i18next";
import { reportError } from "../lib/monitoring";

interface Props extends WithTranslation {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}
interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    reportError(error, { componentStack: info.componentStack });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return <>{this.props.fallback}</>;
      const { t } = this.props;
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#0F1115] text-white p-6">
          <div className="max-w-md w-full bg-[#16191F] border border-white/10 rounded-2xl p-6 space-y-4">
            <h1 className="font-display font-black text-2xl">{t("errorBoundary.title")}</h1>
            <p className="text-sm text-white/60">{t("errorBoundary.description")}</p>
            {this.state.error && (
              <pre className="text-[10px] text-red-400/80 bg-black/40 p-3 rounded-lg overflow-auto max-h-40">
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={() => window.location.reload()}
              className="w-full py-2.5 px-4 bg-teal-500 hover:bg-teal-400 text-black font-extrabold rounded-xl text-xs uppercase tracking-wider transition"
            >
              {t("errorBoundary.reload")}
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default withTranslation()(ErrorBoundary);
