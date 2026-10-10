import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "../../components/fluxora";
import OrderResult from "./order-result";
import styles from "../shop-cards.module.css";

export const metadata:Metadata = {
  title:"Your Order | Fluxora Shop",
  robots:{index:false,follow:false},
};

export default function OrderPage() {
  return (
    <div className={`fluxora-theme ${styles.page}`} data-home-theme="gold" data-shop-theme="true">
      <SiteHeader links={[{href:"/shop",label:"Shop"},{href:"/tools",label:"Tools"},{href:"/member",label:"Member"}]}
        cta={{href:"/shop",label:"Back to shop"}} />
      <main className={styles.main}>
        <div className={styles.shell} style={{paddingTop:65,minHeight:"65vh"}}>
          <h1 style={{fontFamily:"var(--font-inter),Inter,sans-serif",fontSize:39,letterSpacing:"-.04em",marginBottom:24}}>Your order</h1>
          <OrderResult />
        </div>
      </main>
      <SiteFooter meta="© 2026 Fluxora" />
    </div>
  );
}
