// client/src/pages/Queue.jsx
import React, { useEffect, useMemo, useState } from "react";
import { getPriorityQueue } from "../api";
import { Link } from "react-router-dom";

const INR = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);

const RiskPill = ({ risk }) => {
  const map = {
    high: "badge bg-danger",
    medium: "badge bg-warning text-dark",
    low: "badge bg-success",
  };
  return <span className={map[risk] || map.low}>{risk}</span>;
};

export default function Queue() {
  const [rows, setRows] = useState([]);
  const [riskFilter, setRiskFilter] = useState("all");

  useEffect(() => {
    getPriorityQueue().then((r) => setRows(Array.isArray(r) ? r : []));
  }, []);

  const filtered = useMemo(() => {
    // ✅ Filter out the de-prioritized accounts
    const active = rows.filter((r) => r.priority_score > -900);
    if (riskFilter === "all") return active;
    return active.filter((r) => r.risk_level === riskFilter);
  }, [rows, riskFilter]);

  return (
    <div className="card p-3 shadow-sm">
      <div className="d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Calling Queue (by priority)</h5>

        {/* Filter toolbar */}
        <div className="btn-group" role="group">
          {["all", "high", "medium", "low"].map((k) => (
            <button
              key={k}
              className={`btn btn-sm ${
                riskFilter === k ? "btn-primary" : "btn-outline-primary"
              }`}
              onClick={() => setRiskFilter(k)}
            >
              {k === "all" ? "All" : k[0].toUpperCase() + k.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <table className="table table-sm small mt-3 align-middle">
        <thead>
          <tr>
            <th style={{ width: 40 }}>#</th>
            <th>Name</th>
            <th style={{ width: 80 }}>DPD</th>
            <th style={{ width: 90 }} className="text-center">
              Score
            </th>
            <th style={{ width: 120 }}>EMI</th>
            <th style={{ width: 90 }}>Risk</th>
            <th style={{ width: 140 }}>Flags</th>
            <th style={{ width: 160 }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {!filtered.length && (
            <tr>
              <td colSpan={8} className="text-muted">
                No borrowers in queue.
              </td>
            </tr>
          )}
          {filtered.map((b, i) => (
            <tr key={b._id || i}>
              <td>{i + 1}</td>
              <td>
                {b.name} <span className="text-muted">({b.language})</span>
              </td>
              <td>{b.dpd}</td>
              <td className="text-center">
                <span className="badge bg-dark">{b.priority_score}</span>
              </td>
              <td>{INR(b.emi_amount)}</td>
              <td>
                <RiskPill risk={b.risk_level} />
              </td>
              <td>
                {/* ✅ DISPLAY NEW FLAGS */}
                {b.hardship_flag && (
                  <span className="badge bg-secondary me-1">Hardship</span>
                )}
                {b.dispute_flag && (
                  <span className="badge bg-danger me-1">Dispute</span>
                )}
                {b.safe_mode_flag && (
                  <span className="badge bg-danger me-1">Abuse</span>
                )}
                {b.legal_escalation_flag && (
                  <span className="badge bg-dark me-1">Legal</span>
                )}
                {b.invalid_number_flag && (
                  <span className="badge bg-warning text-dark me-1">
                    Invalid #
                  </span>
                )}
              </td>
              <td>
                <Link
                  to={`/borrower/${b._id}`}
                  className="btn btn-sm btn-primary"
                >
                  360
                </Link>
                <Link
                  to={`/call/${b._id}`}
                  className="btn btn-sm btn-outline-primary ms-2"
                >
                  Call
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
