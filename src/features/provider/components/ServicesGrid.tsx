"use client";

import { useState } from "react";
import { ServiceCard } from "./ServiceCard";

interface ServiceData {
  id: string;
  title: string;
  status: "DRAFT" | "PENDING_APPROVAL" | "ACTIVE" | "SUSPENDED" | "DELETED";
  pricingType: "FIXED" | "SUR_DEVIS";
  fixedPrice: number | null;
  durationMinutes: number | null;
  photoUrls: string[];
  category: {
    name: string;
    parent: { name: string } | null;
  };
}

interface ServicesGridProps {
  initialServices: ServiceData[];
}

/**
 * Client wrapper for My Services grid — manages local state so
 * toggle and delete operations update the UI without a full page reload.
 */
export function ServicesGrid({ initialServices }: ServicesGridProps) {
  const [services, setServices] = useState<ServiceData[]>(initialServices);

  const handleToggle = (id: string) => {
    setServices((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        return {
          ...s,
          status:
            s.status === "ACTIVE"
              ? ("DRAFT" as const)
              : ("ACTIVE" as const),
        };
      }),
    );
  };

  const handleDelete = (id: string) => {
    setServices((prev) => prev.filter((s) => s.id !== id));
  };

  if (services.length === 0) {
    return null; // Parent handles empty state
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {services.map((service) => (
        <ServiceCard
          key={service.id}
          service={service}
          onToggle={handleToggle}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
}
