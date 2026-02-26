"use client";

import { useTranslations } from "next-intl";
import {
  LineChart,
  Line,
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
  // month is "YYYY-MM"
  const [year, monthStr] = month.split("-");
  if (!year || !monthStr) return month;
  const date = new Date(
    parseInt(year),
    parseInt(monthStr) - 1,
    1,
  );
  return new Intl.DateTimeFormat("fr-TN", {
    month: "short",
    year: "2-digit",
  }).format(date);
}

function formatRevenueTick(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
  return `${value}`;
}

// ============================================================
// TYPES
// ============================================================

interface RevenueLineChartProps {
  data: { month: string; revenue: number }[];
}

// ============================================================
// COMPONENT
// ============================================================

export function RevenueLineChart({ data }: RevenueLineChartProps) {
  const t = useTranslations("admin.analytics");

  const formattedData = data.map((d) => ({
    ...d,
    label: formatMonthLabel(d.month),
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{t("revenueOverTime")}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={formattedData}
            margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatRevenueTick}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(value: number | undefined) => [
                value != null ? `${value.toFixed(0)} TND` : "—",
                t("totalRevenue"),
              ]}
              labelStyle={{ color: "hsl(var(--foreground))" }}
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px",
              }}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ fill: "hsl(var(--primary))", r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
