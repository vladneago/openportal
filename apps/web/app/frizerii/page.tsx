import type { Metadata } from "next";
import { IndustryLandingPage } from "@/components/marketing/IndustryLandingPage";
import { getIndustryLanding } from "@/components/marketing/industry-data";

const data = getIndustryLanding("frizerii")!;

export const metadata: Metadata = {
  title: data.title,
  description: data.description,
  openGraph: {
    title: data.ogTitle,
    description: data.description,
    type: "website",
  },
  alternates: {
    canonical: "/frizerii",
  },
};

export default function FrizeriiPage() {
  return <IndustryLandingPage data={data} />;
}
