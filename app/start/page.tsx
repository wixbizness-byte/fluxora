import type { Metadata } from "next";
import StartGuide from "./start-guide";

export const metadata: Metadata = {
  title: "Start with Fluxora | Fluxora",
  description: "Answer a short creator quiz and get a focused Fluxora tool recommendation and starting route.",
};

export default function StartPage() {
  return <StartGuide />;
}
