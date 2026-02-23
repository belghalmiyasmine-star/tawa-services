"use client";

import { useState } from "react";

import { KycStatusPage } from "@/features/kyc/components/KycStatusPage";
import { KycWizard } from "@/features/kyc/components/KycWizard";

type KycStatus = "NOT_SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED";

interface KycPageClientProps {
  providerId: string;
  initialStatus: KycStatus;
  submittedAt?: Date | null;
  approvedAt?: Date | null;
  rejectedAt?: Date | null;
  rejectedReason?: string | null;
}

export function KycPageClient({
  providerId,
  initialStatus,
  submittedAt,
  approvedAt,
  rejectedAt,
  rejectedReason,
}: KycPageClientProps) {
  // Show wizard if NOT_SUBMITTED, or if REJECTED and user clicked resubmit
  const [showWizard, setShowWizard] = useState(
    initialStatus === "NOT_SUBMITTED" || initialStatus === "REJECTED",
  );

  // After submission, show pending status
  const [submittedStatus, setSubmittedStatus] = useState<KycStatus | null>(
    null,
  );

  function handleWizardComplete() {
    setSubmittedStatus("PENDING");
    setShowWizard(false);
  }

  function handleResubmit() {
    setSubmittedStatus(null);
    setShowWizard(true);
  }

  // If wizard just completed, show PENDING status
  if (submittedStatus === "PENDING") {
    return (
      <KycStatusPage
        status="PENDING"
        submittedAt={new Date()}
        onResubmit={handleResubmit}
      />
    );
  }

  // Show wizard for NOT_SUBMITTED or REJECTED (resubmitting)
  if (showWizard) {
    return (
      <KycWizard
        providerId={providerId}
        onComplete={handleWizardComplete}
      />
    );
  }

  // Show status page for PENDING or APPROVED
  return (
    <KycStatusPage
      status={initialStatus}
      submittedAt={submittedAt}
      approvedAt={approvedAt}
      rejectedAt={rejectedAt}
      rejectedReason={rejectedReason}
      onResubmit={handleResubmit}
    />
  );
}
