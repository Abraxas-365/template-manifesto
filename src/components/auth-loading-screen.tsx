import { Spinner } from "@/components/ui/spinner";

export function AuthLoadingScreen() {
  return (
    <div className="flex min-h-svh items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Spinner className="size-6" />
        <p className="text-muted-foreground text-sm">
          Verifying your session...
        </p>
      </div>
    </div>
  );
}
