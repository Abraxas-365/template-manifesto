import { useState, useEffect } from "react";
import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ArrowLeft, Mail, ShieldCheck, FileText, Lock } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { GoogleIcon, MicrosoftIcon } from "@/components/auth/oauth-icons";
import {
  useDiscoverTenants,
  useOAuthLogin,
  useOtpLoginInit,
  useOtpLoginVerify,
  useOtpResend,
} from "@/domains/auth/hooks";
import type { TenantInfo } from "@/domains/auth/types";

const searchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/auth/")({
  validateSearch: searchSchema,
  component: LoginPage,
});

type Step = "email" | "tenant" | "method" | "otp";

const emailSchema = z.object({
  email: z.email("Please enter a valid email address"),
});

type EmailFormValues = z.infer<typeof emailSchema>;

function LoginPage() {
  const { redirect: redirectTo } = useSearch({ from: "/auth/" });
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [tenants, setTenants] = useState<TenantInfo[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<TenantInfo | null>(null);
  const [serverError, setServerError] = useState<string | null>(() => {
    // Read OAuth error from query param (set by backend redirect)
    const params = new URLSearchParams(window.location.search);
    return params.get("error");
  });
  const [otpValue, setOtpValue] = useState("");
  const [resendCountdown, setResendCountdown] = useState(0);

  const discoverTenants = useDiscoverTenants();
  const oAuthLogin = useOAuthLogin(redirectTo);
  const otpLoginInit = useOtpLoginInit();
  const otpLoginVerify = useOtpLoginVerify(redirectTo);
  const otpResend = useOtpResend();

  const emailForm = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });

  // Countdown timer for OTP resend
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setTimeout(() => setResendCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  const isLoading =
    discoverTenants.isPending ||
    oAuthLogin.isPending ||
    otpLoginInit.isPending ||
    otpLoginVerify.isPending;

  const handleEmailSubmit = async (values: EmailFormValues) => {
    setServerError(null);
    try {
      const result = await discoverTenants.mutateAsync({
        body: { email: values.email },
      });
      setEmail(values.email);
      setTenants(result.tenants);

      if (result.count === 0) {
        setServerError("No account found for this email address.");
        return;
      }
      if (result.count === 1) {
        setSelectedTenant(result.tenants[0]!);
        setStep("method");
      } else {
        setStep("tenant");
      }
    } catch {
      setServerError("Something went wrong. Please try again.");
    }
  };

  const handleTenantSelect = (tenant: TenantInfo) => {
    setSelectedTenant(tenant);
    setStep("method");
  };

  const handleOtpRequest = async () => {
    if (!selectedTenant) return;
    setServerError(null);
    try {
      await otpLoginInit.mutateAsync({
        body: { email, tenant_id: selectedTenant.tenant_id },
      });
      setOtpValue("");
      setResendCountdown(60);
      setStep("otp");
    } catch {
      // Global mutation error handler shows toast
    }
  };

  const handleOtpVerify = async () => {
    if (!selectedTenant || otpValue.length !== 6) return;
    setServerError(null);
    try {
      await otpLoginVerify.mutateAsync({
        body: {
          email,
          code: otpValue,
          tenant_id: selectedTenant.tenant_id,
        },
      });
    } catch {
      setServerError("Invalid or expired code. Please try again.");
    }
  };

  const handleResend = async () => {
    if (!selectedTenant || resendCountdown > 0) return;
    try {
      await otpResend.mutateAsync({
        body: {
          email,
          tenant_id: selectedTenant.tenant_id,
          purpose: "login",
        },
      });
      setResendCountdown(60);
      toast.success("A new code has been sent to your email.");
    } catch {
      // Global mutation error handler shows toast
    }
  };

  const goBack = () => {
    setServerError(null);
    if (step === "otp") setStep("method");
    else if (step === "method") {
      if (tenants.length > 1) setStep("tenant");
      else setStep("email");
    } else if (step === "tenant") setStep("email");
  };

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* Left: Auth Form */}
      <div className="flex flex-col gap-4 bg-white p-6 md:p-10">
        <div className="flex items-center gap-2.5 md:justify-start">
          <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-[#b84f3c] shadow-md shadow-primary/25">
            <span className="text-sm font-bold text-white">M</span>
          </div>
          <span className="font-display text-xl font-bold tracking-tight text-foreground">
            metrica
          </span>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm">
            {step === "email" && (
              <EmailStep
                form={emailForm}
                onSubmit={handleEmailSubmit}
                onOAuth={(provider) => oAuthLogin.initiate(provider)}
                serverError={serverError}
                isLoading={isLoading}
              />
            )}
            {step === "tenant" && (
              <TenantStep
                tenants={tenants}
                onSelect={handleTenantSelect}
                onBack={goBack}
              />
            )}
            {step === "method" && selectedTenant && (
              <MethodStep
                tenant={selectedTenant}
                email={email}
                onOtp={handleOtpRequest}
                onOAuth={(provider) => oAuthLogin.initiate(provider)}
                onBack={goBack}
                serverError={serverError}
                isLoading={isLoading}
              />
            )}
            {step === "otp" && (
              <OtpStep
                email={email}
                otpValue={otpValue}
                onOtpChange={setOtpValue}
                onVerify={handleOtpVerify}
                onResend={handleResend}
                resendCountdown={resendCountdown}
                onBack={goBack}
                serverError={serverError}
                isLoading={isLoading}
              />
            )}
          </div>
        </div>
      </div>
      {/* Right: Branded Panel */}
      <div className="relative hidden overflow-hidden lg:block"
        style={{ background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)" }}
      >
        {/* Decorative gradient orbs */}
        <div className="absolute -right-20 -top-20 size-80 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #dc6b56 0%, transparent 70%)" }}
        />
        <div className="absolute -bottom-32 -left-20 size-96 rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, #f4a292 0%, transparent 70%)" }}
        />

        <div className="relative flex h-full flex-col items-center justify-center p-12">
          <div className="max-w-md">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-white/70 backdrop-blur-sm">
              <ShieldCheck className="size-4 text-primary" />
              ISO 27001 Compliance
            </div>
            <h2 className="font-display text-4xl font-bold leading-tight tracking-tight text-white">
              Document Management,{" "}
              <span className="bg-gradient-to-r from-[#f4a292] to-[#dc6b56] bg-clip-text text-transparent">
                Simplified
              </span>
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-400">
              Create, manage, and maintain your ISO compliance documents
              with intelligent templates and collaborative workflows.
            </p>
            <div className="mt-10 space-y-3">
              <div className="flex items-center gap-4 rounded-xl border border-white/5 bg-white/5 p-4 backdrop-blur-sm transition-colors hover:bg-white/10">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/20">
                  <FileText className="size-5 text-[#f4a292]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Knowledge Base</p>
                  <p className="text-xs text-slate-400">Pre-built ISO 27001 reference frameworks</p>
                </div>
              </div>
              <div className="flex items-center gap-4 rounded-xl border border-white/5 bg-white/5 p-4 backdrop-blur-sm transition-colors hover:bg-white/10">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-indigo-500/20">
                  <Lock className="size-5 text-indigo-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Access Controls</p>
                  <p className="text-xs text-slate-400">Role-based permissions and audit trails</p>
                </div>
              </div>
              <div className="flex items-center gap-4 rounded-xl border border-white/5 bg-white/5 p-4 backdrop-blur-sm transition-colors hover:bg-white/10">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20">
                  <ShieldCheck className="size-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Compliance Ready</p>
                  <p className="text-xs text-slate-400">Automated gap analysis and reporting</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Email Step ───────────────────────────────────────────────────────────────

function EmailStep({
  form,
  onSubmit,
  onOAuth,
  serverError,
  isLoading,
}: {
  form: ReturnType<typeof useForm<EmailFormValues>>;
  onSubmit: (values: EmailFormValues) => Promise<void>;
  onOAuth: (provider: "GOOGLE" | "MICROSOFT") => void;
  serverError: string | null;
  isLoading: boolean;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Welcome back</h1>
        <p className="text-muted-foreground text-sm">
          Sign in to your account to continue
        </p>
      </div>

      <div className="grid gap-3">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => onOAuth("GOOGLE")}
          disabled={isLoading}
        >
          <GoogleIcon />
          Continue with Google
        </Button>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => onOAuth("MICROSOFT")}
          disabled={isLoading}
        >
          <MicrosoftIcon />
          Continue with Microsoft
        </Button>
      </div>

      <div className="relative text-center text-sm">
        <Separator />
        <span className="bg-background text-muted-foreground relative -top-3 inline-block px-2">
          Or continue with email
        </span>
      </div>

      {serverError && (
        <Alert variant="destructive">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="animate-spin" />}
            Continue
          </Button>
        </form>
      </Form>
    </div>
  );
}

// ─── Tenant Step ──────────────────────────────────────────────────────────────

function TenantStep({
  tenants,
  onSelect,
  onBack,
}: {
  tenants: TenantInfo[];
  onSelect: (tenant: TenantInfo) => void;
  onBack: () => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Choose an organization</h1>
        <p className="text-muted-foreground text-sm">
          Your email is associated with multiple organizations
        </p>
      </div>

      <div className="grid gap-3">
        {tenants.map((tenant) => (
          <Card
            key={tenant.tenant_id}
            className="cursor-pointer py-4 transition-colors hover:bg-secondary"
            onClick={() => onSelect(tenant)}
          >
            <CardHeader className="pb-0">
              <CardTitle className="text-base">{tenant.company_name}</CardTitle>
              <CardDescription className="text-xs">
                {[
                  tenant.auth_methods.otp && "Email code",
                  tenant.auth_methods.oauth &&
                    tenant.auth_methods.oauth_provider,
                ]
                  .filter(Boolean)
                  .join(" / ")}
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Button variant="ghost" className="w-full" onClick={onBack}>
        <ArrowLeft className="size-4" />
        Back
      </Button>
    </div>
  );
}

// ─── Method Step ──────────────────────────────────────────────────────────────

function MethodStep({
  tenant,
  email,
  onOtp,
  onOAuth,
  onBack,
  serverError,
  isLoading,
}: {
  tenant: TenantInfo;
  email: string;
  onOtp: () => Promise<void>;
  onOAuth: (provider: "GOOGLE" | "MICROSOFT") => void;
  onBack: () => void;
  serverError: string | null;
  isLoading: boolean;
}) {
  const provider = tenant.auth_methods.oauth_provider?.toUpperCase() as
    | "GOOGLE"
    | "MICROSOFT";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Sign in to {tenant.company_name}</h1>
        <p className="text-muted-foreground text-sm">{email}</p>
      </div>

      {serverError && (
        <Alert variant="destructive">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-3">
        {tenant.auth_methods.otp && (
          <Button className="w-full" onClick={onOtp} disabled={isLoading}>
            {isLoading && <Loader2 className="animate-spin" />}
            <Mail className="size-4" />
            Send me a login code
          </Button>
        )}
        {tenant.auth_methods.oauth && provider === "GOOGLE" && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => onOAuth("GOOGLE")}
            disabled={isLoading}
          >
            <GoogleIcon />
            Continue with Google
          </Button>
        )}
        {tenant.auth_methods.oauth && provider === "MICROSOFT" && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => onOAuth("MICROSOFT")}
            disabled={isLoading}
          >
            <MicrosoftIcon />
            Continue with Microsoft
          </Button>
        )}
      </div>

      <Button variant="ghost" className="w-full" onClick={onBack}>
        <ArrowLeft className="size-4" />
        Back
      </Button>
    </div>
  );
}

// ─── OTP Step ─────────────────────────────────────────────────────────────────

function OtpStep({
  email,
  otpValue,
  onOtpChange,
  onVerify,
  onResend,
  resendCountdown,
  onBack,
  serverError,
  isLoading,
}: {
  email: string;
  otpValue: string;
  onOtpChange: (value: string) => void;
  onVerify: () => Promise<void>;
  onResend: () => Promise<void>;
  resendCountdown: number;
  onBack: () => void;
  serverError: string | null;
  isLoading: boolean;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Check your email</h1>
        <p className="text-muted-foreground text-sm">
          We sent a 6-digit code to{" "}
          <span className="font-medium text-foreground">{email}</span>
        </p>
      </div>

      {serverError && (
        <Alert variant="destructive">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col items-center gap-4">
        <InputOTP
          maxLength={6}
          value={otpValue}
          onChange={onOtpChange}
          disabled={isLoading}
        >
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup>
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>

        <Button
          className="w-full"
          onClick={onVerify}
          disabled={isLoading || otpValue.length !== 6}
        >
          {isLoading && <Loader2 className="animate-spin" />}
          Verify
        </Button>

        <div className="text-sm text-center">
          <span className="text-muted-foreground">Didn't receive a code? </span>
          {resendCountdown > 0 ? (
            <span className="text-muted-foreground">
              Resend in {resendCountdown}s
            </span>
          ) : (
            <button
              type="button"
              className="text-primary underline-offset-4 hover:underline font-medium"
              onClick={onResend}
              disabled={isLoading}
            >
              Resend code
            </button>
          )}
        </div>
      </div>

      <Button variant="ghost" className="w-full" onClick={onBack}>
        <ArrowLeft className="size-4" />
        Back
      </Button>
    </div>
  );
}
