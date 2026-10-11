import type { Metadata } from "next";
import { SellLoader } from "./loader";

export const metadata: Metadata = { title: "List a product", robots: { index: false } };

export default function SellPage() {
  return <SellLoader />;
}
