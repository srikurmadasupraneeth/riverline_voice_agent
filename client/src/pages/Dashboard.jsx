import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useBorrowers } from "../store";
import { getTodayQueue } from "../api";

const fmtINR = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);

const langName = (c) =>
  c === "hi"
    ? "Hindi"
    : c === "te"
    ? "Telugu"
    : c === "ta"
    ? "Tamil"
    : "English";

function computeDPD(b, today = new Date()) {
  const due = new Date(b.next_due_date);
  const T = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (T <= due) return 0;
  return Math.max(0, Math.floor((T - due) / (1000 * 60 * 60 * 24)));
}
function priorityFromDPD(dpd) {
  if (dpd > 30) return { label: "High priority", cls: "badge bg-danger" };
  if (dpd > 0)
    return { label: "Medium priority", cls: "badge bg-warning text-dark" };
  return { label: "Low priority", cls: "badge bg-success" };
}

export default function Dashboard() {
  const { data, loading } = useBorrowers();
  const [queue, setQueue] = useState([]);

  useEffect(() => {
    getTodayQueue().then(setQueue);
  }, []);

  if (loading) return <div>Loading…</div>;

  const totalLoan = data.reduce(
    (s, b) => s + (Number(b.total_loan_amount) || 0),
    0
  );
  const totalDue = data.reduce((s, b) => s + (Number(b.amount_due) || 0), 0);

  return (
    <>
      <h3 className="fw-bold mb-1">Collections Dashboard</h3>
      <p className="text-muted small">
        AI-powered agents helping borrowers repay on time.
      </p>

      {/* KPIs */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="card p-2 shadow-sm">
            <div className="text-muted small">Borrowers</div>
            <h5 className="fw-bold">{data.length}</h5>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card p-2 shadow-sm">
            <div className="text-muted small">Total Loan Book</div>
            <h5 className="fw-bold">{fmtINR(totalLoan)}</h5>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card p-2 shadow-sm">
            <div className="text-muted small">Amount Due (this cycle)</div>
            <h5 className="fw-bold">{fmtINR(totalDue)}</h5>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card p-2 shadow-sm">
            <div className="text-muted small">Right-now Priority</div>
            <h5 className="fw-bold">
              {data.filter((b) => computeDPD(b) > 30).length} high DPD
            </h5>
          </div>
        </div>
      </div>

      {/* Calling Queue */}
      <div className="row g-4 mb-3">
        <div className="col-lg-4">
          <div className="card p-3 shadow-sm h-100">
            <h6 className="fw-semibold mb-2">Today’s Calling Queue</h6>
            {queue.slice(0, 5).map((q, i) => (
              <div
                key={q._id || i}
                className="d-flex justify-content-between border-bottom py-1 small"
              >
                <span>
                  {i + 1}. {q.name}
                </span>
                <span className="text-muted">
                  Score{" "}
                  <span className="badge bg-dark">{q.priority_score}</span>
                </span>
              </div>
            ))}
            <div className="small text-muted mt-1">
              Sorted by DPD, promises, and engagement.
            </div>
          </div>
        </div>

        {/* Borrower Cards */}
        <div className="col-lg-8">
          <div className="row g-4">
            {data.map((b) => {
              const dpd = computeDPD(b);
              const pr = priorityFromDPD(dpd);
              return (
                <div className="col-md-6" key={b._id}>
                  <div className="card p-3 shadow-sm">
                    <div className="d-flex justify-content-between">
                      <strong>{b.name}</strong>
                      <div className="d-flex gap-2">
                        <span className="badge-soft">
                          {langName(b.language)}
                        </span>
                        <span className={pr.cls}>{pr.label}</span>
                      </div>
                    </div>
                    <small className="text-muted">📞 {b.phone}</small>
                    <hr />
                    <div className="small text-muted">
                      Total Loan: <strong>{fmtINR(b.total_loan_amount)}</strong>
                      <br />
                      EMI: <strong>{fmtINR(b.emi_amount)}</strong>
                      <br />
                      Next Due:{" "}
                      <strong>
                        {new Date(b.next_due_date).toLocaleDateString("en-IN")}
                      </strong>
                    </div>
                    <div className="small mt-1">
                      {dpd === 0 ? (
                        <>
                          Status:{" "}
                          <span className="badge bg-success">on time</span>
                        </>
                      ) : (
                        <>
                          Missed: <span className={pr.cls}>{dpd} days</span>
                        </>
                      )}
                      {b.active_ptp && (
                        <span className="badge bg-info text-dark ms-2">
                          Active PTP
                        </span>
                      )}
                    </div>
                    <div className="mt-2 d-flex gap-2">
                      <Link
                        className="btn btn-sm btn-outline-secondary"
                        to={`/borrower/${b._id}`}
                      >
                        Borrower 360
                      </Link>
                      <Link
                        className="btn btn-sm btn-primary"
                        to={`/call/${b._id}`}
                      >
                        Start Voice Call
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
