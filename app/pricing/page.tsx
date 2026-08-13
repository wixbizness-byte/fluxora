import Site from "../site";
import PricingDraftEnhancer from "./pricing-draft-enhancer";
import styles from "./pricing-page.module.css";
import themeStyles from "./pricing-main-theme.module.css";
import draftStyles from "./pricing-draft.module.css";

export default function PricingPage() {
  return (
    <div className={`${styles.pricingPage} ${themeStyles.mainTheme} ${draftStyles.draft}`}>
      <Site pricingMode />
      <PricingDraftEnhancer />
    </div>
  );
}
