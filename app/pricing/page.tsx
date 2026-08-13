import Site from "../site";

export default function PricingPage() {
  return (
    <div className="pricing-page">
      <style>{`.pricing-page .easy-payments { display: none !important; }`}</style>
      <Site pricingMode />
    </div>
  );
}
