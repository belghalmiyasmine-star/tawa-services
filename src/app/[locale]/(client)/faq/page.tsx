import type { Metadata } from "next";

import { FaqClient } from "./faq-client";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "FAQ | Tawa Services",
  description:
    "Questions fréquemment posées sur Tawa Services — clients et prestataires.",
};

export default function FaqPage() {
  return <FaqClient />;
}
