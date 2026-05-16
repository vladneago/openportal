import type { Metadata } from "next";
import { IndustryLandingPage } from "@/components/marketing/IndustryLandingPage";
import { getIndustryLanding } from "@/components/marketing/industry-data";

const data = getIndustryLanding("cofetarii")!;

export const metadata: Metadata = {
  title: data.title,
  description: data.description,
  openGraph: {
    title: data.ogTitle,
    description: data.description,
    type: "website",
  },
  alternates: {
    canonical: "/cofetarii",
  },
};

export default function CofetariiPage() {
  return <IndustryLandingPage data={data} />;
}
