"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

// Simple SVG icons for Google and Facebook
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M17.64 9.2045C17.64 8.5663 17.5827 7.9527 17.4764 7.3636H9V10.845H13.8436C13.635 11.97 13.0009 12.9231 12.0477 13.5613V15.8195H14.9564C16.6582 14.2527 17.64 11.9454 17.64 9.2045Z"
        fill="#4285F4"
      />
      <path
        d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5613C11.2418 14.1013 10.2109 14.4204 9 14.4204C6.65591 14.4204 4.67182 12.8372 3.96409 10.71H0.957275V13.0418C2.43818 15.9831 5.48182 18 9 18Z"
        fill="#34A853"
      />
      <path
        d="M3.96409 10.71C3.78409 10.17 3.68182 9.5931 3.68182 9C3.68182 8.4068 3.78409 7.8299 3.96409 7.2899V4.9581H0.957273C0.347727 6.1731 0 7.5477 0 9C0 10.4522 0.347727 11.8268 0.957273 13.0418L3.96409 10.71Z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.5795C10.3214 3.5795 11.5077 4.0336 12.4405 4.9254L15.0218 2.344C13.4632 0.8918 11.4259 0 9 0C5.48182 0 2.43818 2.0168 0.957275 4.9581L3.96409 7.29C4.67182 5.1627 6.65591 3.5795 9 3.5795Z"
        fill="#EA4335"
      />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M18 9C18 4.0294 13.9706 0 9 0C4.0294 0 0 4.0294 0 9C0 13.4916 3.2914 17.2149 7.5938 17.8907V11.6016H5.3086V9H7.5938V7.0195C7.5938 4.7617 8.9302 3.5156 10.9893 3.5156C11.9746 3.5156 13.0078 3.6914 13.0078 3.6914V5.9063H11.8711C10.7504 5.9063 10.4063 6.6 10.4063 7.3125V9H12.9023L12.5044 11.6016H10.4063V17.8907C14.7086 17.2149 18 13.4916 18 9Z"
        fill="#1877F2"
      />
    </svg>
  );
}

export function OAuthButtons() {
  const t = useTranslations("auth");
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingFacebook, setLoadingFacebook] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoadingGoogle(true);
    try {
      await signIn("google", { callbackUrl: "/auth/oauth-role" });
    } finally {
      setLoadingGoogle(false);
    }
  };

  const handleFacebookSignIn = async () => {
    setLoadingFacebook(true);
    try {
      await signIn("facebook", { callbackUrl: "/auth/oauth-role" });
    } finally {
      setLoadingFacebook(false);
    }
  };

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="outline"
        className="w-full gap-2"
        onClick={handleGoogleSignIn}
        disabled={loadingGoogle || loadingFacebook}
      >
        <GoogleIcon />
        {loadingGoogle ? t("loading") : t("continueGoogle")}
      </Button>

      <Button
        type="button"
        variant="outline"
        className="w-full gap-2"
        onClick={handleFacebookSignIn}
        disabled={loadingGoogle || loadingFacebook}
      >
        <FacebookIcon />
        {loadingFacebook ? t("loading") : t("continueFacebook")}
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator className="w-full" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">{t("orSeparator")}</span>
        </div>
      </div>
    </div>
  );
}
