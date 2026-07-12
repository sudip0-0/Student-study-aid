import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "../ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message || "Something went wrong" };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-background px-4 text-center">
          <h1 className="font-heading text-2xl font-black">Something went wrong</h1>
          <p className="max-w-md text-sm font-bold text-muted-foreground">{this.state.message}</p>
          <Button
            onClick={() => {
              this.setState({ hasError: false, message: "" });
              window.location.assign("/app");
            }}
          >
            Back to dashboard
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
