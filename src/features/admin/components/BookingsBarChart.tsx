"use client";

import { useTranslations } from "next-intl";
import {
  BarChart,
  Bar,
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

interface BookingsBarChartProps {
  data: { month: string; count: number }[];
}

// ============================================================
// COMPONENT
// ============================================================

export function BookingsBarChart({ data }: BookingsBarChartProps) {
  const t = useTranslations("admin.analytics");

  const formattedData = data.map((d) => ({
    ...d,
    label: formatMonthLabel(d.month),
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{t("bookingsOverTime")}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
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
              allowDecimals={false}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(value: number | undefined) => [
                value ?? 0,
                t("totalTransactions"),
              ]}
              labelStyle={{ color: "hsl(var(--foreground))" }}
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px",
              }}
            />
            <Bar
              dataKey="count"
              fill="hsl(var(--primary))"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
