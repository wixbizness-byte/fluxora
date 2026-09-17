import type { Metadata } from "next";
import StartGuide from "./start-guide";
import polish from "./start-polish.module.css";

export const metadata: Metadata = {
  title: "Start with Fluxora | Fluxora",
  description: "Answer a short creator quiz and get a focused Fluxora tool recommendation and starting route.",
};

export default function StartPage() {
  return (
    <div className={polish.wrapper}>
      <StartGuide />
    </div>
  );
}
