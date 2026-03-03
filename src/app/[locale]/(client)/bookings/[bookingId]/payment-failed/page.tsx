import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { XCircle } from "lucide-react";
import Link from "next/link";

import { authOptions } from "@/lib/auth";
import { redirect } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Paiement echoue | Tawa Services",
  description: "Votre paiement n'a pas pu etre traite",
};

interface PaymentFailedPageProps {
  params: Promise<{ bookingId: string; locale: string }>;
}

export default async function PaymentFailedPage({
  params,
}: PaymentFailedPageProps) {
  const { bookingId } = await params;
  const locale = await getLocale();
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return redirect({ href: "/auth/login", locale });
  }

  if (session.user.role !== "CLIENT") {
    return redirect({ href: "/", locale });
  }

  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      clientId: session.user.id,
      isDeleted: false,
    },
    include: {
      service: { select: { title: true } },
      payment: { select: { status: true } },
    },
  });

  if (!booking) {
    return notFound();
  }

  // If payment was already completed, redirect to confirmation
  if (booking.payment && booking.payment.status !== "PENDING") {
    return redirect({
      href: `/bookings/${bookingId}/confirmation` as never,
      locale,
    });
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <XCircle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-xl">Paiement echoue</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Le paiement pour &quot;{booking.service.title}&quot; n&apos;a pas pu
            etre traite. Aucun montant n&apos;a ete debite.
          </p>
          <div className="flex flex-col gap-2">
            <Button asChild>
              <Link href={`/${locale}/bookings/${bookingId}/checkout`}>
                Reessayer le paiement
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/${locale}/bookings`}>
                Retour aux reservations
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
