import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchBorrower, collectPayment } from "../api";

const fmtINR = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);

export default function PaymentSimulator() {
  const { id } = useParams();
  const [b, setB] = useState(null);
  const [amount, setAmount] = useState("");

  useEffect(() => {
    fetchBorrower(id).then(setB);
  }, [id]);

  if (!b) return <div>Loading…</div>;

  return (
    <div className="card p-3 shadow-sm">
      <h5>Collect Payment</h5>
      <div className="small text-muted">
        EMI: {fmtINR(b.emi_amount)} • Current Due:{" "}
        {fmtINR(b.amount_due || b.emi_amount)}
      </div>
      <div className="input-group mt-3">
        <input
          className="form-control"
          type="number"
          placeholder={`e.g. ${b.emi_amount}`}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <button
          className="btn btn-primary"
          onClick={async () => {
            const res = await collectPayment(b._id, Number(amount));
            alert(
              `Applied: ${fmtINR(res.applied_amount)} • Next due: ${new Date(
                res.next_due_date
              ).toLocaleDateString("en-IN")}`
            );
          }}
        >
          Apply
        </button>
      </div>
      <Link
        to={`/borrower/${b._id}`}
        className="btn btn-outline-secondary mt-3"
      >
        Back to 360
      </Link>
    </div>
  );
}
