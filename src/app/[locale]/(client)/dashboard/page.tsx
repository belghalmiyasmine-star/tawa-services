import { getServerSession } from "next-auth";
import { getLocale, getTranslations } from "next-intl/server";

import { authOptions } from "@/lib/auth";
import { redirect } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/routing";
import {
  CalendarCheck,
  Star,
  Bell,
  Heart,
  ArrowRight,
  Search,
  ShieldCheck,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";

function relativeTime(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "A l'instant";
  if (minutes < 60) return `Il y a ${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `Il y a ${days}j`;
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export default async function ClientDashboardPage() {
  const session = await getServerSession(authOptions);
  const locale = await getLocale();

  if (!session?.user?.id) {
    return redirect({ href: "/auth/login", locale });
  }

  if (session.user.role !== "CLIENT") {
    return redirect({ href: "/", locale });
  }

  const t = await getTranslations("clientDashboard");
  const userId = session.user.id;

  // Fetch dashboard data in parallel
  const [
    upcomingBookings,
    pendingReviewBookings,
    recentNotifications,
    totalBookingsCount,
    totalSpentAggregate,
    reviewsGivenCount,
    favoriteEntries,
  ] = await Promise.all([
      // Upcoming bookings (ACCEPTED or PENDING)
      prisma.booking.findMany({
        where: {
          clientId: userId,
          isDeleted: false,
          status: { in: ["ACCEPTED", "PENDING"] },
        },
        include: {
          service: { select: { title: true, photoUrls: true } },
          provider: { select: { displayName: true, photoUrl: true } },
        },
        orderBy: { scheduledAt: "asc" },
        take: 5,
      }),
      // Completed bookings awaiting review (within 10-day window)
      prisma.booking.findMany({
        where: {
          clientId: userId,
          isDeleted: false,
          status: "COMPLETED",
          completedAt: {
            gte: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          },
          reviews: {
            none: { authorId: userId, isDeleted: false },
          },
        },
        include: {
          service: { select: { title: true } },
          provider: { select: { displayName: true } },
        },
        orderBy: { completedAt: "desc" },
        take: 5,
      }),
      // Recent notifications
      prisma.notification.findMany({
        where: { userId, isDeleted: false },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      // Total bookings count
      prisma.booking.count({
        where: { clientId: userId, isDeleted: false },
      }),
      // Total amount spent (sum of RELEASED payment amounts)
      prisma.payment.aggregate({
        where: {
          booking: { clientId: userId },
          status: "RELEASED",
          isDeleted: false,
        },
        _sum: { amount: true },
      }),
      // Total reviews given
      prisma.review.count({
        where: { authorId: userId, isDeleted: false },
      }),
      // Favorite services → providers
      prisma.favorite.findMany({
        where: { userId },
        include: {
          service: {
            select: {
              provider: {
                select: {
                  id: true,
                  displayName: true,
                  photoUrl: true,
                  rating: true,
                  ratingCount: true,
                  kycStatus: true,
                  delegations: {
                    include: {
                      delegation: {
                        include: { gouvernorat: { select: { name: true } } },
                      },
                    },
                    take: 1,
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

  const totalSpent = totalSpentAggregate._sum.amount ?? 0;

  // Deduplicate providers from favorites (user may favorite multiple services from same provider)
  const seenProviderIds = new Set<string>();
  const favoriteProviders = favoriteEntries
    .map((fav) => fav.service.provider)
    .filter((provider) => {
      if (seenProviderIds.has(provider.id)) return false;
      seenProviderIds.add(provider.id);
      return true;
    })
    .slice(0, 6);

  const userName = session.user.name?.split(" ")[0];

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Welcome */}
      <h1 className="text-3xl font-bold">
        {userName ? t("welcome", { name: userName }) : t("welcomeDefault")}
      </h1>

      {/* Stats bar */}
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <div className="rounded-xl border bg-card p-3 shadow-sm md:p-4">
          <p className="text-xs text-muted-foreground md:text-sm">{t("totalBookings")}</p>
          <p className="text-xl font-bold md:text-2xl">{totalBookingsCount}</p>
        </div>
        <div className="rounded-xl border bg-card p-3 shadow-sm md:p-4">
          <p className="text-xs text-muted-foreground md:text-sm">{t("totalSpent")}</p>
          <p className="text-xl font-bold md:text-2xl">
            {totalSpent.toFixed(0)}{" "}
            <span className="text-xs font-normal text-muted-foreground md:text-sm">TND</span>
          </p>
        </div>
        <div className="rounded-xl border bg-card p-3 shadow-sm md:p-4">
          <p className="text-xs text-muted-foreground md:text-sm">{t("reviewsGiven")}</p>
          <p className="text-xl font-bold md:text-2xl">{reviewsGivenCount}</p>
        </div>
        <div className="rounded-xl border bg-card p-3 shadow-sm md:p-4">
          <p className="text-xs text-muted-foreground md:text-sm">{t("favoritesCount")}</p>
          <p className="text-xl font-bold md:text-2xl">{favoriteProviders.length}</p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Upcoming Bookings */}
        <section className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">{t("upcomingBookings")}</h2>
            </div>
            {upcomingBookings.length > 0 && (
              <Link href="/bookings" className="text-sm text-primary hover:underline">
                {t("viewAll")} <ArrowRight className="ml-1 inline h-3 w-3" />
              </Link>
            )}
          </div>

          {upcomingBookings.length === 0 ? (
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">{t("noUpcomingBookings")}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t("noUpcomingBookingsDesc")}</p>
              <Button asChild size="sm" className="mt-4">
                <Link href="/services">
                  <Search className="mr-2 h-4 w-4" />
                  {t("browseServices")}
                </Link>
              </Button>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {upcomingBookings.map((booking) => (
                <Link
                  key={booking.id}
                  href={`/bookings/${booking.id}` as never}
                  className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <CalendarCheck className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 truncate">
                    <p className="text-sm font-medium">{booking.service.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {booking.provider && `${t("with")} ${booking.provider.displayName}`}
                      {booking.scheduledAt && (
                        <>
                          {" "}&middot; {t("scheduledFor")}{" "}
                          {new Date(booking.scheduledAt).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                          })}
                        </>
                      )}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Pending Reviews */}
        <section className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            <h2 className="text-lg font-semibold">{t("pendingReviews")}</h2>
          </div>

          {pendingReviewBookings.length === 0 ? (
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">{t("noPendingReviews")}</p>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {pendingReviewBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="truncate">
                    <p className="text-sm font-medium">{booking.service.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {booking.provider && booking.provider.displayName}
                    </p>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/bookings/${booking.id}/review` as never}>
                      {t("leaveReview")}
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recent Activity (Notifications) */}
        <section className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">{t("recentActivity")}</h2>
            </div>
            {recentNotifications.length > 0 && (
              <Link href="/notifications" className="text-sm text-primary hover:underline">
                {t("viewAll")} <ArrowRight className="ml-1 inline h-3 w-3" />
              </Link>
            )}
          </div>

          {recentNotifications.length === 0 ? (
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">{t("noRecentActivity")}</p>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {recentNotifications.map((notif) => (
                <div
                  key={notif.id}
                  className="flex items-start gap-3 rounded-lg border p-3"
                >
                  <div
                    className={`mt-1 h-2 w-2 flex-shrink-0 rounded-full ${
                      notif.read ? "bg-muted" : "bg-primary"
                    }`}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{notif.title}</p>
                    {notif.body && (
                      <p className="text-xs text-muted-foreground line-clamp-1">{notif.body}</p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {relativeTime(notif.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Favorite Providers */}
        <section className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              <h2 className="text-lg font-semibold">{t("favoriteProviders")}</h2>
            </div>
            {favoriteProviders.length > 0 && (
              <Link href="/services" className="text-sm text-primary hover:underline">
                {t("viewAll")} <ArrowRight className="ml-1 inline h-3 w-3" />
              </Link>
            )}
          </div>

          {favoriteProviders.length === 0 ? (
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">{t("noFavorites")}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t("noFavoritesDesc")}</p>
              <Button asChild size="sm" variant="outline" className="mt-4">
                <Link href="/services">{t("browseServices")}</Link>
              </Button>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {favoriteProviders.map((provider) => {
                const city =
                  provider.delegations.length > 0
                    ? provider.delegations[0]?.delegation.gouvernorat.name
                    : null;
                const isVerified = provider.kycStatus === "APPROVED";

                return (
                  <Link
                    key={provider.id}
                    href={`/providers/${provider.id}` as never}
                    className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  >
                    {/* Avatar */}
                    {provider.photoUrl ? (
                      <img
                        src={provider.photoUrl}
                        alt={provider.displayName}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <span className="text-sm font-semibold text-primary">
                          {provider.displayName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 truncate">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-sm font-medium">{provider.displayName}</p>
                        {isVerified && (
                          <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-0.5">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          {provider.rating.toFixed(1)}
                          <span className="text-muted-foreground/60">
                            ({provider.ratingCount})
                          </span>
                        </span>
                        {city && (
                          <span className="flex items-center gap-0.5">
                            <MapPin className="h-3 w-3" />
                            {city}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Favorite heart */}
                    <Heart className="h-4 w-4 shrink-0 fill-red-500 text-red-500" />
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
