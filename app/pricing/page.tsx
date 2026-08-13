import Site from "../site";
import styles from "./pricing-page.module.css";
import themeStyles from "./pricing-main-theme.module.css";

export default function PricingPage() {
  return (
    <div className={`${styles.pricingPage} ${themeStyles.mainTheme}`}>
      <Site pricingMode />
    </div>
  );
}
