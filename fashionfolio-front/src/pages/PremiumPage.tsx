import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";

type Plan = "monthly" | "yearly";

const PLANS: { id: Plan; label: string; price: string; note?: string; savings?: string }[] = [
  {
    id: "monthly",
    label: "Monthly",
    price: "€9.99",
    note: "Billed monthly",
  },
  {
    id: "yearly",
    label: "Yearly",
    price: "€7.99",
    note: "Billed as €95.88 / year",
    savings: "Save 20%",
  },
];

const FEATURES = [
  "Unlimited wardrobe items",
  "AI-powered outfit suggestions",
  "Exclusive style analytics",
  "Priority feed visibility",
  "Early access to new features",
  "Ad-free experience",
];

export function PremiumPage() {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<Plan>("yearly");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubscribe() {
    setError(null);
    setLoading(true);

    try {
      const response = await api.post("/payments/create-checkout-session", {
        plan: selectedPlan,
      });

      // Redirect to the payment terminal URL (e.g. Stripe Checkout)
      if (response.data?.checkout_url) {
        window.location.href = response.data.checkout_url;
      } else {
        throw new Error("No checkout URL returned.");
      }
    } catch {
      setError("Payment terminal is not available yet. Please try again later.");
    } finally {
      setLoading(false);
    }
  }

  const activePlan = PLANS.find((p) => p.id === selectedPlan)!;

  return (
    <section>
      <h1>Go Premium ✦</h1>
      <p>Unlock the full Fashionfolio experience and curate your wardrobe like a professional.</p>

      {/* Plan selector */}
      <div className="friends-list" style={{ marginTop: "1.5rem" }}>
        {PLANS.map((plan) => (
          <button
            key={plan.id}
            type="button"
            className={`friend-pill ${selectedPlan === plan.id ? "friend-pill-active" : ""}`}
            onClick={() => setSelectedPlan(plan.id)}
          >
            {plan.label}
            {plan.savings && (
              <span className="status-pill" style={{ marginLeft: "0.5rem", fontSize: "0.7rem" }}>
                {plan.savings}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Price display */}
      <div className="card" style={{ marginTop: "1rem", textAlign: "center" }}>
        <p style={{ fontSize: "2.5rem", fontWeight: 700, margin: 0, color: "#f9fafb" }}>
          {activePlan.price}
          <span style={{ fontSize: "1rem", fontWeight: 400, color: "#9ca3af" }}> / month</span>
        </p>
        {activePlan.note && (
          <p className="card-meta" style={{ marginTop: "0.35rem" }}>
            {activePlan.note}
          </p>
        )}
      </div>

      {/* Features list */}
      <div className="list">
        {FEATURES.map((feature, i) => (
          <div key={i} className="card card-row">
            <span style={{ color: "#a855f7", fontWeight: 700, fontSize: "1rem" }}>✦</span>
            <span style={{ fontSize: "0.875rem" }}>{feature}</span>
          </div>
        ))}
      </div>

      {/* Error */}
      {error && <p className="form-error" style={{ marginTop: "1rem" }}>{error}</p>}

      {/* CTA */}
      <div className="form">
        <button
          type="button"
          className="primary-button"
          onClick={handleSubscribe}
          disabled={loading}
        >
          {loading ? "Redirecting to payment..." : "Subscribe Now"}
        </button>

        <div style={{ textAlign: "center" }}>
          <button type="button" className="link-button" onClick={() => navigate(-1)}>
            ← Go back
          </button>
        </div>

        <p style={{ textAlign: "center", fontSize: "0.75rem", color: "#6b7280", margin: 0 }}>
          Cancel anytime. No hidden fees.
        </p>
      </div>
    </section>
  );
}