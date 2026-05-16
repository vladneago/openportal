import type { Metadata } from "next";
import { ComparisonPage } from "@/components/marketing/ComparisonPage";
import { getComparison } from "@/components/marketing/comparison-data";

const data = getComparison("wix")!;

export const metadata: Metadata = {
  title: data.title,
  description: data.description,
  openGraph: { title: data.ogTitle, description: data.description, type: "website" },
  alternates: { canonical: "/vs/wix" },
};

export default function WixComparisonPage() {
  return <ComparisonPage data={data} />;
}
