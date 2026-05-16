import type { Metadata } from "next";
import { IndustryLandingPage } from "@/components/marketing/IndustryLandingPage";
import { getIndustryLanding } from "@/components/marketing/industry-data";

const data = getIndustryLanding("contabili")!;

export const metadata: Metadata = {
  title: data.title,
  description: data.description,
  openGraph: { title: data.ogTitle, description: data.description, type: "website" },
  alternates: { canonical: "/contabili" },
};

export default function ContabiliPage() {
  return <IndustryLandingPage data={data} />;
}
