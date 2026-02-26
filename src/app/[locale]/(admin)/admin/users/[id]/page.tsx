import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { ArrowLeft, Calendar, Star, Flag } from "lucide-react";

import { Link } from "@/i18n/routing";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getUserDetailAction } from "@/features/admin/actions/admin-queries";
import { UserDetailActions } from "@/features/admin/components/UserDetailActions";

// ============================================================
// METADATA
// ============================================================

type PageProps = {
  params: Promise<{ id: string; locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const result = await getUserDetailAction(id);
  const userName = result.success ? (result.data.name ?? "Utilisateur") : "Utilisateur";
  return {
    title: `${userName} | Admin`,
  };
}

// ============================================================
// HELPERS
// ============================================================

function getInitials(name: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return (parts[0]?.[0] ?? "?").toUpperCase();
  return ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase();
}

const KYC_STATUS_LABELS: Record<string, string> = {
  NOT_SUBMITTED: "Non soumis",
  PENDING: "En attente",
  APPROVED: "Approuve",
  REJECTED: "Rejete",
};

const KYC_STATUS_VARIANTS: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  NOT_SUBMITTED: "secondary",
  PENDING: "outline",
  APPROVED: "default",
  REJECTED: "destructive",
};

// ============================================================
// PAGE
// ============================================================

export default async function AdminUserDetailPage({ params }: PageProps) {
  const { id } = await params;
  const t = await getTranslations("admin.users");

  const result = await getUserDetailAction(id);

  if (!result.success) {
    redirect("/admin/users");
  }

  const user = result.data;

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux utilisateurs
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Profile Card */}
        <div className="space-y-6 lg:col-span-1">
          {/* Profile Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center gap-4 text-center">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={user.avatarUrl ?? undefined} alt={user.name ?? ""} />
                  <AvatarFallback className="text-2xl">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>

                <div>
                  <h2 className="text-xl font-bold">{user.name ?? "—"}</h2>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>

                <div className="flex flex-wrap justify-center gap-2">
                  {/* Role Badge */}
                  <Badge variant={user.role === "ADMIN" ? "outline" : user.role === "PROVIDER" ? "secondary" : "default"}>
                    {user.role === "CLIENT"
                      ? "Client"
                      : user.role === "PROVIDER"
                        ? "Prestataire"
                        : "Admin"}
                  </Badge>

                  {/* Status Badge */}
                  {user.isBanned ? (
                    <Badge variant="destructive">Banni</Badge>
                  ) : user.isActive ? (
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-100">
                      Actif
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Inactif</Badge>
                  )}
                </div>
              </div>

              <Separator className="my-4" />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("memberSince")}</span>
                  <span className="font-medium">
                    {new Intl.DateTimeFormat("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    }).format(new Date(user.createdAt))}
                  </span>
                </div>

                {user.isBanned && user.bannedAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Banni le</span>
                    <span className="font-medium text-destructive">
                      {new Intl.DateTimeFormat("fr-FR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      }).format(new Date(user.bannedAt))}
                    </span>
                  </div>
                )}

                {user.bannedReason && (
                  <div className="mt-2 rounded-md bg-destructive/10 p-2">
                    <p className="text-xs text-destructive">
                      Motif: {user.bannedReason}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Provider Info — if applicable */}
          {user.provider && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">
                  Informations prestataire
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nom affiché</span>
                  <span className="font-medium">{user.provider.displayName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("kycStatus")}</span>
                  <Badge
                    variant={KYC_STATUS_VARIANTS[user.provider.kycStatus] ?? "secondary"}
                    className="text-xs"
                  >
                    {KYC_STATUS_LABELS[user.provider.kycStatus] ?? user.provider.kycStatus}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons — non-admin users only */}
          {user.role !== "ADMIN" && (
            <UserDetailActions user={user} />
          )}
        </div>

        {/* Right Column: Stats */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Statistiques</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {/* Bookings */}
                <div className="flex flex-col items-center rounded-lg border p-4 text-center">
                  <Calendar className="mb-2 h-8 w-8 text-primary" />
                  <p className="text-2xl font-bold">{user.bookingsCount}</p>
                  <p className="text-xs text-muted-foreground">{t("bookingsCount")}</p>
                </div>

                {/* Reviews */}
                <div className="flex flex-col items-center rounded-lg border p-4 text-center">
                  <Star className="mb-2 h-8 w-8 text-amber-500" />
                  <p className="text-2xl font-bold">{user.reviewsCount}</p>
                  <p className="text-xs text-muted-foreground">{t("reviewsCount")}</p>
                </div>

                {/* Reports */}
                <div className="flex flex-col items-center rounded-lg border p-4 text-center">
                  <Flag className="mb-2 h-8 w-8 text-red-500" />
                  <p className="text-2xl font-bold">{user.reportsCount}</p>
                  <p className="text-xs text-muted-foreground">{t("reportsCount")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
