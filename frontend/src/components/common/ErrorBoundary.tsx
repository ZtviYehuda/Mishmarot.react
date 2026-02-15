import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ShieldAlert, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 text-white p-4 relative overflow-hidden font-heebo">
          {/* Animated Background Grid */}
          <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "radial-gradient(#3b82f6 1.5px, transparent 1.5px), radial-gradient(#3b82f6 1.5px, transparent 1.5px)",
                backgroundSize: "40px 40px",
                backgroundPosition: "0 0, 20px 20px",
              }}
            />
          </div>

          <div className="relative z-10 flex flex-col items-center max-w-md w-full text-center animate-in fade-in zoom-in duration-500">
            {/* Animated Icon Container */}
            <div className="mb-8 relative">
              <div className="absolute inset-0 bg-red-500 blur-3xl opacity-20 animate-pulse rounded-full" />
              <div className="relative w-24 h-24 bg-gradient-to-br from-red-500/20 to-red-600/10 rounded-[32px] border border-red-500/30 flex items-center justify-center shadow-2xl backdrop-blur-sm">
                <ShieldAlert className="w-12 h-12 text-red-500" />
              </div>
            </div>

            {/* Error Message */}
            <h1 className="text-4xl font-black mb-3 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60 tracking-tight">
              וואופס! משהו השתבש
            </h1>

            <p className="text-slate-400 text-lg mb-8 leading-relaxed max-w-[80%]">
              המערכת נתקלה בשגיאה לא צפויה. אל דאגה, המידע שלך שמור ומאובטח.
            </p>

            {/* Error Details (Only in Dev/Debug) */}
            {import.meta.env.DEV && this.state.error && (
              <div
                className="w-full bg-black/40 p-4 rounded-xl border border-white/10 mb-8 max-h-40 overflow-y-auto text-left"
                dir="ltr"
              >
                <code className="text-xs text-red-400 font-mono block whitespace-pre-wrap">
                  {this.state.error.toString()}
                </code>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Button
                size="lg"
                onClick={() => window.location.reload()}
                className="bg-blue-600 hover:bg-blue-500 text-white border-none shadow-lg shadow-blue-600/25 h-12 px-8 rounded-xl font-bold transition-all hover:scale-105 active:scale-95 gap-2"
              >
                <RefreshCw className="w-5 h-5 animate-spin-slow" />
                רענון המערכת
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={() => (window.location.href = "/")}
                className="bg-white/5 border-white/10 hover:bg-white/10 text-white h-12 px-8 rounded-xl font-bold transition-all hover:scale-105 active:scale-95 gap-2"
              >
                <Home className="w-5 h-5" />
                חזרה לראשי
              </Button>
            </div>
          </div>

          {/* Footer Decoration */}
          <div className="absolute bottom-8 text-xs text-slate-600 font-medium">
            Error Code: 500_CLIENT_CRASH
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
