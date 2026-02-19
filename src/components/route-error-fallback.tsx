import { useRouter } from "@tanstack/react-router";
import type { ErrorComponentProps } from "@tanstack/react-router";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { extractErrorMessage } from "@/lib/error-utils";

export function RouteErrorFallback({ error, reset }: ErrorComponentProps) {
  const router = useRouter();

  const message = extractErrorMessage(error);

  const handleRetry = () => {
    reset();
    router.invalidate();
  };

  return (
    <div className="flex min-h-[50vh] items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription className="mt-2">{message}</AlertDescription>
        </Alert>
        <div className="mt-4 flex gap-3">
          <Button onClick={handleRetry}>Retry</Button>
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
