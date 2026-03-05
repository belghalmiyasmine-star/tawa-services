"use client";

import { type ReactNode } from "react";
import { useInView } from "@/hooks/use-in-view";

interface SectionFadeInProps {
  children: ReactNode;
  className?: string;
  delay?: string;
}

export function SectionFadeIn({ children, className = "", delay = "0s" }: SectionFadeInProps) {
  const { ref, inView } = useInView({ threshold: 0.1 });

  return (
    <div
      ref={ref}
      className={`${inView ? "section-visible" : "section-hidden"} ${className}`}
      style={{ ["--stagger" as string]: delay }}
    >
      {children}
    </div>
  );
}
