"use client";

import { useTranslations } from "next-intl";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// ============================================================
// HELPERS
// ============================================================

function formatMonthLabel(month: string): string {
  const [year, monthStr] = month.split("-");
  if (!year || !monthStr) return month;
  const date = new Date(parseInt(year), parseInt(monthStr) - 1, 1);
  return new Intl.DateTimeFormat("fr-TN", {
    month: "short",
    year: "2-digit",
  }).format(date);
}

// ============================================================
// TYPES
// ============================================================

interface UserGrowthAreaChartProps {
  data: { month: string; newUsers: number }[];
}

// ============================================================
// COMPONENT
// ============================================================

export function UserGrowthAreaChart({ data }: UserGrowthAreaChartProps) {
  const t = useTranslations("admin.analytics");

  const formattedData = data.map((d) => ({
    ...d,
    label: formatMonthLabel(d.month),
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{t("activeUsers")}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart
            data={formattedData}
            margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
          >
            <defs>
              <linearGradient id="userGrowthGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(value: number | undefined) => [
                value ?? 0,
                t("activeUsers"),
              ]}
              labelStyle={{ color: "hsl(var(--foreground))" }}
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px",
              }}
            />
            <Area
              type="monotone"
              dataKey="newUsers"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#userGrowthGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
