import Site from "../site";
import styles from "./pricing-page.module.css";

export default function PricingPage() {
  return (
    <div className={styles.pricingPage}>
      <Site pricingMode />
    </div>
  );
}
