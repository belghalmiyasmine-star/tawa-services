"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/routing";

// ============================================================
// TYPES
// ============================================================

interface DashboardChartsProps {
  monthlyRevenue: { month: string; revenue: number }[];
  bookingsByStatus: { status: string; count: number }[];
  userGrowth: { month: string; count: number }[];
  revenueByCategory: { category: string; revenue: number }[];
}

// ============================================================
// CONSTANTS
// ============================================================

const COLORS = ["#0ea5e9", "#8b5cf6", "#f59e0b", "#ef4444", "#10b981", "#ec4899"];

const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  CONFIRMED: "Confirmé",
  IN_PROGRESS: "En cours",
  COMPLETED: "Terminé",
  CANCELLED: "Annulé",
  DISPUTED: "Litige",
};

function shortMonth(month: string) {
  const [, m] = month.split("-");
  const months = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
  return months[parseInt(m!, 10) - 1] ?? m;
}

// ============================================================
// COMPONENT
// ============================================================

export function DashboardCharts({
  monthlyRevenue,
  bookingsByStatus,
  userGrowth,
  revenueByCategory,
}: DashboardChartsProps) {
  const bookingsData = bookingsByStatus.map((b) => ({
    name: STATUS_LABELS[b.status] ?? b.status,
    count: b.count,
  }));

  const revenueData = monthlyRevenue.map((r) => ({
    month: shortMonth(r.month),
    revenue: Math.round(r.revenue),
  }));

  const growthData = userGrowth.map((u) => ({
    month: shortMonth(u.month),
    count: u.count,
  }));

  const categoryData = revenueByCategory.slice(0, 6).map((c) => ({
    name: c.category.length > 12 ? c.category.slice(0, 12) + "…" : c.category,
    value: Math.round(c.revenue),
  }));

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {/* Revenue Trend — LineChart */}
      <Link href="/admin/analytics" className="block">
        <Card className="h-full transition-colors hover:bg-accent/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Revenus (6 mois)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-36">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData}>
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis hide />
                  <Tooltip
                    formatter={(value) => [`${Number(value).toLocaleString("fr-FR")} TND`, "Revenu"]}
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#0ea5e9"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "#0ea5e9" }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* Bookings by Status — BarChart */}
      <Link href="/admin/analytics" className="block">
        <Card className="h-full transition-colors hover:bg-accent/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Réservations par statut
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-36">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bookingsData}>
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    height={40}
                  />
                  <YAxis hide />
                  <Tooltip
                    formatter={(value) => [Number(value), "Réservations"]}
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {bookingsData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* Revenue by Category — PieChart */}
      <Link href="/admin/analytics" className="block">
        <Card className="h-full transition-colors hover:bg-accent/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Revenus par catégorie
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-36">
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={55}
                      paddingAngle={2}
                    >
                      {categoryData.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [`${Number(value).toLocaleString("fr-FR")} TND`]}
                      contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                  Aucune donnée
                </div>
              )}
            </div>
            {categoryData.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {categoryData.map((cat, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    />
                    <span className="text-[10px] text-muted-foreground">{cat.name}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </Link>

      {/* User Growth — AreaChart */}
      <Link href="/admin/analytics" className="block">
        <Card className="h-full transition-colors hover:bg-accent/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Croissance utilisateurs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-36">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={growthData}>
                  <defs>
                    <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis hide />
                  <Tooltip
                    formatter={(value) => [Number(value), "Nouveaux utilisateurs"]}
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#growthGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
