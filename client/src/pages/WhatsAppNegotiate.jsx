// client/src/pages/WhatsAppNegotiate.jsx
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchBorrower, getSettlementReco, createSettlement } from "../api";

const INR = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);

export default function WhatsAppNegotiate() {
  const { id } = useParams();
  const [b, setB] = useState(null);
  const [reco, setReco] = useState(null);
  const [amount, setAmount] = useState("");
  const [valid, setValid] = useState(7);
  const [preview, setPreview] = useState("");

  useEffect(() => {
    (async () => {
      const bx = await fetchBorrower(id);
      setB(bx);
      const r = await getSettlementReco(id);
      setReco(r);
      setAmount(r?.recommended_amount ?? "");
    })();
  }, [id]);

  useEffect(() => {
    if (!b) return;
    setPreview(
      `Hi ${b.name}, this is Riverline. We can settle your dues at ${INR(
        amount
      )} if paid within ${valid} days. Reply YES to confirm.`
    );
  }, [b, amount, valid]);

  if (!b || !reco) return <div>Loading…</div>;

  return (
    <div className="card p-3 shadow-sm">
      <h5>WhatsApp Negotiation</h5>
      <div className="small text-muted mb-2">
        Suggested: <strong>{INR(reco.recommended_amount)}</strong> • Discount{" "}
        {reco.discount_pct}%
      </div>

      <div className="row g-2">
        <div className="col-md-4">
          <label className="small text-muted">Offer amount</label>
          <input
            className="form-control"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div className="col-md-3">
          <label className="small text-muted">Valid (days)</label>
          <input
            className="form-control"
            type="number"
            value={valid}
            onChange={(e) => setValid(e.target.value)}
          />
        </div>
      </div>

      <div className="alert alert-light border mt-3 small">
        <strong>Preview:</strong>
        <br />
        {preview}
      </div>

      <button
        className="btn btn-primary"
        onClick={async () => {
          await createSettlement(id, Number(amount), Number(valid), "WA offer");
          alert("Offer created & message sent (simulated).");
        }}
      >
        Send Offer on WhatsApp
      </button>

      <Link to={`/borrower/${id}`} className="btn btn-outline-secondary ms-2">
        Back to 360
      </Link>
    </div>
  );
}
