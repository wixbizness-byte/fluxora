import type { Metadata } from "next";
import StartGuide from "./start-guide";

export const metadata: Metadata = {
  title: "Start with Fluxora | Fluxora",
  description: "A guided introduction to Fluxora: choose what you want to create, learn the workflow, open the right tools, and complete your first setup steps.",
};

export default function StartPage() {
  return <StartGuide />;
}
