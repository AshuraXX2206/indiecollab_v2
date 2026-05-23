import React, { Component, ErrorInfo, ReactNode } from "react";
import { ShieldAlert, RefreshCw, Trash2 } from "lucide-react";
import { safeStorage } from "../utils/storage";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State;
  public props: Props;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[Error Boundary] Uncaught error:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetCache = () => {
    if (window.confirm("Bạn có chắc chắn muốn đặt lại toàn bộ dữ liệu tạm thời? Điều này sẽ xóa phiên đăng nhập hiện tại.")) {
      safeStorage.removeItem("indiecollab_session");
      safeStorage.removeItem("indiecollab_logged_out");
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full border border-red-500/30 bg-red-950/20 backdrop-blur-xl p-8 rounded-2xl shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-red-500 via-pink-500 to-red-500"></div>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                <ShieldAlert className="w-8 h-8 text-red-400 animate-pulse" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-red-200">Đã xảy ra sự cố</h1>
                <p className="text-xs text-slate-400">Error Boundary Protection</p>
              </div>
            </div>

            <p className="text-sm text-slate-300 mb-6 leading-relaxed">
              Ứng dụng gặp một lỗi không mong muốn (có thể do trình duyệt cũ hoặc không hỗ trợ WebGL/Canvas). Hãy thử các cách khắc phục dưới đây:
            </p>

            {this.state.error && (
              <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4 mb-6 font-mono text-xs text-red-300 max-h-32 overflow-auto select-all">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button
                onClick={this.handleReload}
                className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl font-medium shadow-lg shadow-indigo-500/15 hover:shadow-indigo-500/25 transition-all active:scale-[0.98]"
              >
                <RefreshCw className="w-4 h-4 animate-spin-slow" />
                Tải lại trang (Reload)
              </button>

              <button
                onClick={this.handleResetCache}
                className="flex items-center justify-center gap-2 w-full py-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 rounded-xl font-medium transition-all"
              >
                <Trash2 className="w-4 h-4" />
                Xóa cache & Đặt lại
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
