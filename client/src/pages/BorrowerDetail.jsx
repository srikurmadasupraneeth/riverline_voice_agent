// client/src/pages/BorrowerDetail.jsx
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  fetchBorrower,
  listPromises,
  markKept,
  markBroken,
  getSettlementReco,
  listSettlements,
  acceptSettlement,
  getConvSummary,
  recomputePersona,
  setFlags,
  getRecoveryFor,
  startTwilioCall, // ✅ IMPORT NEW API FUNCTION
} from "../api";

const fmtINR = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);

function buildSchedule(b) {
  const rows = [];
  const tenure = Number(b.loan_tenure_months);
  const paid = Number(b.months_paid);
  const emi = Number(b.emi_amount);
  const next = new Date(b.next_due_date);
  const start = new Date(next.getFullYear(), next.getMonth(), next.getDate());
  start.setMonth(start.getMonth() - paid);

  for (let i = 0; i < tenure; i++) {
    const due = new Date(start);
    due.setMonth(start.getMonth() + i);
    rows.push({
      index: i + 1,
      status: i < paid ? "PAID" : "UPCOMING",
      due,
      amount: emi,
    });
  }
  return rows;
}

function computeDPD(b, today = new Date()) {
  const due = new Date(b.next_due_date);
  const T = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (T <= due) return 0;
  return Math.max(0, Math.floor((T - due) / (1000 * 60 * 60 * 24)));
}

function riskFromDPD(dpd) {
  if (dpd > 30) return { label: "High risk", class: "badge bg-danger" };
  if (dpd > 0)
    return { label: "Medium risk", class: "badge bg-warning text-dark" };
  return { label: "Low risk", class: "badge bg-success" };
}

export default function BorrowerDetail() {
  const { id } = useParams();
  const [b, setB] = useState(null);
  const [promises, setPromises] = useState([]);
  const [reco, setReco] = useState(null);
  const [offers, setOffers] = useState([]);
  const [convSummary, setConvSummary] = useState("");
  const [persona, setPersona] = useState("");
  const [recovery, setRecovery] = useState(null);

  useEffect(() => {
    fetchBorrower(id).then(async (bx) => {
      setB(bx);
      setPersona(bx.persona || "neutral");
      const r = await getRecoveryFor(id);
      setRecovery(r);
    });
    listPromises(id).then(setPromises);
    getSettlementReco(id).then(setReco);
    listSettlements(id).then(setOffers);

    const params = new URLSearchParams(window.location.search);
    const cid = params.get("conv");
    if (cid) getConvSummary(cid).then((r) => setConvSummary(r.summary || ""));
  }, [id]);

  if (!b) return <div>Loading…</div>;

  const outstanding =
    Number(b.emi_amount) *
    Math.max(0, Number(b.loan_tenure_months) - Number(b.months_paid));

  const schedule = buildSchedule(b);
  const dpd = computeDPD(b);
  const risk = riskFromDPD(dpd);

  const isCallLocked = b.safe_mode_flag || b.legal_escalation_flag;

  // ✅ Handler for the new Twilio call button
  const handleRealCall = async () => {
    if (isCallLocked) return;
    alert(
      "Starting live phone call via Twilio... \n\nIMPORTANT: This requires the server to have a public `WEBHOOK_BASE_URL` (like ngrok) to work."
    );
    const res = await startTwilioCall(id);
    if (res.ok) {
      alert(`Call initiated! SID: ${res.sid}`);
    } else {
      alert(`Call failed: ${res.error}`);
    }
  };

  return (
    <>
      <h4 className="fw-bold">{b.name}</h4>
      <div className="text-muted small">📞 {b.phone}</div>

      {isCallLocked && (
        <div className="alert alert-danger mt-3">
          <strong>Call Locked:</strong> Outreach is blocked for this borrower
          due to
          {b.safe_mode_flag ? " abuse detection." : " legal escalation."}
        </div>
      )}

      <div className="row g-3 mt-3">
        <div className="col-md-8">
          <div className="card shadow-sm p-3">
            <div className="d-flex justify-content-between align-items-center">
              <h6 className="fw-semibold mb-0">Loan Summary</h6>
              <span className={risk.class}>{risk.label}</span>
            </div>
            <hr className="my-2" />

            <div className="row small">
              <div className="col-6">
                Total Loan
                <br />
                <strong>{fmtINR(b.total_loan_amount)}</strong>
              </div>
              <div className="col-6">
                Monthly EMI
                <br />
                <strong>{fmtINR(b.emi_amount)}</strong>
              </div>
              <div className="col-6 mt-1">
                Paid
                <br />
                <strong>
                  {b.months_paid}/{b.loan_tenure_months}
                </strong>
              </div>
              <div className="col-6 mt-1">
                Outstanding
                <br />
                <strong>{fmtINR(outstanding)}</strong>
              </div>
              <div className="col-6 mt-1">
                Next Due
                <br />
                <strong>
                  {new Date(b.next_due_date).toLocaleDateString("en-IN")}
                </strong>
              </div>
              <div className="col-6 mt-1">
                DPD
                <br />
                <strong>{dpd === 0 ? "0 (on time)" : dpd}</strong>
              </div>

              <div className="col-12 mt-2">
                Persona: <span className="badge bg-dark">{persona}</span>
                {b.hardship_flag && (
                  <span className="badge bg-secondary ms-2">Hardship</span>
                )}
                {b.dispute_flag && (
                  <span className="badge bg-danger ms-2">Dispute</span>
                )}
                {b.safe_mode_flag && (
                  <span className="badge bg-danger ms-2">Abuse</span>
                )}
                {b.legal_escalation_flag && (
                  <span className="badge bg-dark ms-2">Legal</span>
                )}
                {b.invalid_number_flag && (
                  <span className="badge bg-warning text-dark ms-2">
                    Invalid #
                  </span>
                )}
              </div>
            </div>

            <div className="mt-3">
              <div className="progress">
                <div
                  className="progress-bar bg-success"
                  style={{
                    width: `${(b.months_paid / b.loan_tenure_months) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div className="d-flex gap-2 mt-3">
              <Link
                to={isCallLocked ? "#" : `/call/${b._id}`}
                className={`btn btn-primary flex-fill ${
                  isCallLocked ? "disabled" : ""
                }`}
                title={
                  isCallLocked
                    ? "Call is locked due to compliance flag"
                    : "Run in-browser call simulator"
                }
              >
                Start Voice Simulator
              </Link>
              <button
                className={`btn btn-success ${isCallLocked ? "disabled" : ""}`}
                onClick={handleRealCall}
                disabled={isCallLocked}
                title="Start a real phone call (Twilio)"
              >
                📞 Live Call
              </button>
              <Link to={`/pay/${b._id}`} className="btn btn-outline-primary">
                Pay Now
              </Link>
            </div>
          </div>

          {/* EMI Schedule */}
          <div className="card p-3 shadow-sm mt-3">
            <h6>EMI Schedule</h6>
            <table className="table table-sm small mt-2">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>#</th>
                  <th style={{ width: 120 }}>Status</th>
                  <th style={{ width: 140 }}>Due</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {schedule.map((e) => (
                  <tr key={e.index}>
                    <td>{e.index}</td>
                    <td>
                      {e.status === "PAID" ? (
                        <span className="badge bg-success">PAID</span>
                      ) : (
                        <span className="badge bg-secondary">UPCOMING</span>
                      )}
                    </td>
                    <td>{new Date(e.due).toLocaleDateString("en-IN")}</td>
                    <td>{fmtINR(e.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Call Summary */}
          <div className="card p-3 shadow-sm mt-3">
            <h6>Call Summary</h6>
            {!convSummary ? (
              <div className="text-muted small">No summary yet.</div>
            ) : (
              <pre className="small mb-0">{convSummary}</pre>
            )}
          </div>
        </div>

        <div className="col-md-4">
          {/* Promises */}
          <div className="card p-3 shadow-sm">
            <h6>Promises (PTP)</h6>
            {!promises.length && (
              <div className="text-muted small">No promises</div>
            )}
            {promises.map((p) => (
              <div key={p._id} className="border rounded p-2 mt-1 small">
                {fmtINR(p.amount)} •{" "}
                {new Date(p.due_date).toLocaleDateString("en-IN")}
                <br />
                Status:{" "}
                <span
                  className={`badge ${
                    p.status === "BROKEN"
                      ? "bg-danger"
                      : p.status === "KEPT"
                      ? "bg-success"
                      : "bg-info text-dark"
                  }`}
                >
                  {p.status}
                </span>
                {p.status === "PTP" && (
                  <div className="d-flex gap-2 mt-2">
                    <button
                      className="btn btn-success btn-sm"
                      onClick={async () => {
                        await markKept(p._id);
                        setPromises(await listPromises(id));
                      }}
                    >
                      Mark Kept
                    </button>
                    <button
                      className="btn btn-outline-danger btn-sm"
                      onClick={async () => {
                        await markBroken(p._id);
                        setPromises(await listPromises(id));
                        const fresh = await fetchBorrower(id);
                        setB(fresh);
                      }}
                    >
                      Mark Broken
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Settlement */}
          <div className="card p-3 shadow-sm mt-3">
            <h6>Settlement</h6>
            {!reco ? (
              <div className="text-muted small">Loading…</div>
            ) : (
              <>
                Suggested: <strong>{fmtINR(reco.recommended_amount)}</strong>
                <br />
                Discount: {reco.discount_pct}%
                <Link
                  className="btn btn-sm btn-outline-primary w-100 mt-2"
                  to={`/whatsapp/${id}`}
                >
                  Open WhatsApp Negotiate
                </Link>
                {offers.map((o) => (
                  <div key={o._id} className="border rounded p-2 mt-2 small">
                    <span
                      className={`badge ${
                        o.status === "ACCEPTED"
                          ? "bg-success"
                          : o.status === "REJECTED"
                          ? "bg-dark"
                          : "bg-primary"
                      }`}
                    >
                      {o.status}
                    </span>
                    <br />
                    Offer: {fmtINR(o.offered_amount)} • valid till{" "}
                    {new Date(o.valid_until).toLocaleDateString("en-IN")}
                    {o.status === "OFFERED" && (
                      <button
                        className="btn btn-success btn-sm mt-2"
                        onClick={async () => {
                          await acceptSettlement(o._id);
                          setOffers(await listSettlements(id));
                        }}
                      >
                        Mark Accepted
                      </button>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Expected Recovery */}
          <div className="card p-3 shadow-sm mt-3">
            <h6>Expected Recovery</h6>
            {!recovery ? (
              <div className="small text-muted">Loading…</div>
            ) : (
              <>
                <div className="small">
                  Next 7 days: <strong>₹{recovery.exp7}</strong>
                </div>
                <div className="small">
                  Next 30 days: <strong>₹{recovery.exp30}</strong>
                </div>
                <div className="small mt-2">
                  Best Contact: <strong>{recovery.bestTime.window}</strong>
                </div>
                <div className="small">
                  Channels:{" "}
                  {recovery.channels.map((c) => (
                    <span key={c} className="badge bg-light text-dark me-1">
                      {c}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Persona & Flags */}
          <div className="card p-3 shadow-sm mt-3">
            <h6>Persona & Flags</h6>
            <div className="d-flex flex-column gap-2">
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={async () => {
                  const r = await recomputePersona(id);
                  const fresh = await fetchBorrower(id);
                  setB(fresh);
                  setPersona(r.persona || fresh.persona || "neutral");
                }}
              >
                Recompute Persona
              </button>
              <button
                className={`btn btn-sm ${
                  b.hardship_flag ? "btn-secondary" : "btn-outline-dark"
                }`}
                onClick={async () => {
                  await setFlags(id, { hardship: !b.hardship_flag });
                  const fresh = await fetchBorrower(id);
                  setB(fresh);
                }}
              >
                Toggle Hardship
              </button>
              <button
                className={`btn btn-sm ${
                  b.dispute_flag ? "btn-danger" : "btn-outline-danger"
                }`}
                onClick={async () => {
                  await setFlags(id, { dispute: !b.dispute_flag });
                  const fresh = await fetchBorrower(id);
                  setB(fresh);
                }}
              >
                Toggle Dispute
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
