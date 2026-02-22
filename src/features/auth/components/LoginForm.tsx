"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";

import { loginSchema, type LoginFormData } from "@/lib/validations/auth";
import { useRouter, Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Simple math CAPTCHA — avoids external dependencies (sufficient for PFE project)
function generateCaptcha(): { question: string; expected: string } {
  const a = Math.floor(Math.random() * 10) + 1;
  const b = Math.floor(Math.random() * 10) + 1;
  return {
    question: `Combien font ${a} + ${b} ?`,
    expected: String(a + b),
  };
}

const CAPTCHA_THRESHOLD = 3; // Show CAPTCHA after 3 failed attempts

export function LoginForm() {
  const t = useTranslations("auth");
  const tErrors = useTranslations("errors");
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [captcha, setCaptcha] = useState<{ question: string; expected: string } | null>(null);
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [captchaError, setCaptchaError] = useState<string | null>(null);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Generate a new CAPTCHA when threshold is reached
  useEffect(() => {
    if (failedAttempts >= CAPTCHA_THRESHOLD && !captcha) {
      setCaptcha(generateCaptcha());
    }
  }, [failedAttempts, captcha]);

  const refreshCaptcha = () => {
    setCaptcha(generateCaptcha());
    setCaptchaAnswer("");
    setCaptchaError(null);
  };

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setErrorMessage(null);
    setCaptchaError(null);

    // Validate CAPTCHA if shown
    if (captcha) {
      if (!captchaAnswer.trim()) {
        setCaptchaError(t("captchaRequired"));
        setIsLoading(false);
        return;
      }
      if (captchaAnswer.trim() !== captcha.expected) {
        setCaptchaError(t("captchaWrong"));
        setFailedAttempts((prev) => prev + 1);
        refreshCaptcha();
        setIsLoading(false);
        return;
      }
    }

    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        captchaAnswer: captcha ? captchaAnswer.trim() : "",
        captchaExpected: captcha ? captcha.expected : "",
        redirect: false,
      });

      if (result?.error) {
        // Parse lockout errors from the server
        if (result.error.startsWith("LOCKED:")) {
          const minutes = result.error.split(":")[1];
          setErrorMessage(
            t("accountLocked", { minutes: minutes ?? "15" }),
          );
        } else if (result.error === "CAPTCHA_REQUIRED") {
          // CAPTCHA required but not shown yet — show it now
          setFailedAttempts(CAPTCHA_THRESHOLD);
          setErrorMessage(t("captchaRequired"));
        } else {
          // Wrong password or other credential error
          const newAttempts = failedAttempts + 1;
          setFailedAttempts(newAttempts);
          setErrorMessage(t("invalidCredentials"));

          // Refresh captcha on each failed attempt if shown
          if (captcha) {
            refreshCaptcha();
          }
        }
        setIsLoading(false);
        return;
      }

      if (result?.ok) {
        // Successful login — fetch session to determine role-based redirect
        const sessionResponse = await fetch("/api/auth/session");
        const session = (await sessionResponse.json()) as {
          user?: { role?: string };
        } | null;

        const role = session?.user?.role;
        if (role === "PROVIDER") {
          router.push("/provider/dashboard");
        } else if (role === "ADMIN") {
          router.push("/admin");
        } else {
          router.push("/dashboard");
        }
      }
    } catch {
      setErrorMessage(tErrors("serverError"));
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Global error message */}
        {errorMessage && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {errorMessage}
          </div>
        )}

        {/* Email field */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("email")}</FormLabel>
              <FormControl>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    {...field}
                    type="email"
                    placeholder="vous@exemple.com"
                    className="pl-9"
                    autoComplete="email"
                    disabled={isLoading}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Password field */}
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>{t("password")}</FormLabel>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs text-primary hover:underline"
                >
                  {t("forgotPassword")}
                </Link>
              </div>
              <FormControl>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    {...field}
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-9 pr-9"
                    autoComplete="current-password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Remember me */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="rememberMe"
            checked={rememberMe}
            onCheckedChange={(checked) => setRememberMe(checked === true)}
            disabled={isLoading}
          />
          <Label htmlFor="rememberMe" className="cursor-pointer text-sm font-normal">
            {t("rememberMe")}
          </Label>
        </div>

        {/* CAPTCHA challenge — shown after 3 failed attempts */}
        {captcha && failedAttempts >= CAPTCHA_THRESHOLD && (
          <div className="rounded-md border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-950">
            <p className="mb-2 text-sm font-medium text-orange-800 dark:text-orange-200">
              {t("captchaTitle")}
            </p>
            <p className="mb-2 text-sm text-orange-700 dark:text-orange-300">{captcha.question}</p>
            <div className="flex gap-2">
              <Input
                value={captchaAnswer}
                onChange={(e) => setCaptchaAnswer(e.target.value)}
                placeholder={t("captchaPlaceholder")}
                className="max-w-[120px]"
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={refreshCaptcha}
                disabled={isLoading}
              >
                {t("captchaRefresh")}
              </Button>
            </div>
            {captchaError && (
              <p className="mt-1 text-xs text-destructive">{captchaError}</p>
            )}
          </div>
        )}

        {/* Submit */}
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? t("loggingIn") : t("login")}
        </Button>

        {/* Register link */}
        <p className="text-center text-sm text-muted-foreground">
          {t("noAccount")}{" "}
          <Link href="/auth/register" className="font-medium text-primary hover:underline">
            {t("registerLink")}
          </Link>
        </p>
      </form>
    </Form>
  );
}
