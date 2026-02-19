import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (props: { error: Error; reset: () => void }) => ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  reset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error,
          reset: this.reset,
        });
      }

      return (
        <div className="flex min-h-[50vh] items-center justify-center p-6">
          <div className="w-full max-w-md">
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertTitle>Something went wrong</AlertTitle>
              <AlertDescription className="mt-2">
                {this.state.error.message || "An unexpected error occurred."}
              </AlertDescription>
            </Alert>
            <div className="mt-4 flex gap-3">
              <Button onClick={this.reset}>Try Again</Button>
              <Button
                variant="outline"
                onClick={() => (window.location.href = "/")}
              >
                Go Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
