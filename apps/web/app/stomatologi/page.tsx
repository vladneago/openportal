import type { Metadata } from "next";
import { IndustryLandingPage } from "@/components/marketing/IndustryLandingPage";
import { getIndustryLanding } from "@/components/marketing/industry-data";

const data = getIndustryLanding("stomatologi")!;

export const metadata: Metadata = {
  title: data.title,
  description: data.description,
  openGraph: { title: data.ogTitle, description: data.description, type: "website" },
  alternates: { canonical: "/stomatologi" },
};

export default function StomatologiPage() {
  return <IndustryLandingPage data={data} />;
}
