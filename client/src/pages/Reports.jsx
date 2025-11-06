import React, { useEffect, useState } from "react";
import { getRecoveryDashboard, getLeaderboard } from "../api";

export default function Reports() {
  const [dash, setDash] = useState(null);
  const [board, setBoard] = useState([]);
  useEffect(() => {
    getRecoveryDashboard().then(setDash);
    getLeaderboard().then(setBoard);
  }, []);
  if (!dash) return <div>Loading…</div>;
  const { totals, byRisk, outcomes } = dash;
  return (
    <div className="card p-3 shadow-sm">
      <h5>Collections Dashboard</h5>
      <div className="row small mt-2">
        <div className="col-md-3">
          <div className="border rounded p-2">
            Borrowers
            <br />
            <strong>{totals.borrowers}</strong>
          </div>
        </div>
        <div className="col-md-3">
          <div className="border rounded p-2">
            Conversations
            <br />
            <strong>{totals.conversations}</strong>
          </div>
        </div>
        <div className="col-md-3">
          <div className="border rounded p-2">
            PTP Created
            <br />
            <strong>{totals.ptp_created}</strong>
          </div>
        </div>
        <div className="col-md-3">
          <div className="border rounded p-2">
            PTP Kept
            <br />
            <strong>{totals.ptp_kept}</strong>
          </div>
        </div>
        <div className="col-md-3 mt-2">
          <div className="border rounded p-2">
            PTP Broken
            <br />
            <strong>{totals.ptp_broken}</strong>
          </div>
        </div>
        <div className="col-md-3 mt-2">
          <div className="border rounded p-2">
            Offers Sent
            <br />
            <strong>{totals.offers}</strong>
          </div>
        </div>
        <div className="col-md-3 mt-2">
          <div className="border rounded p-2">
            Offers Accepted
            <br />
            <strong>{totals.offers_accepted}</strong>
          </div>
        </div>
        <div className="col-md-3 mt-2">
          <div className="border rounded p-2">
            Promised ₹<br />
            <strong>{totals.promised_amount}</strong>
          </div>
        </div>
        <div className="col-md-3 mt-2">
          <div className="border rounded p-2">
            Accepted ₹<br />
            <strong>{totals.accepted_amount}</strong>
          </div>
        </div>
      </div>

      <h6 className="mt-4">Risk Mix</h6>
      <div className="small">
        {Object.entries(byRisk).map(([k, v]) => (
          <span key={k} className="badge bg-light text-dark me-2">
            {k}: {v}
          </span>
        ))}
      </div>

      <h6 className="mt-3">Call Outcomes</h6>
      <div className="small">
        {Object.entries(outcomes).map(([k, v]) => (
          <span key={k} className="badge bg-light text-dark me-2">
            {k}: {v}
          </span>
        ))}
      </div>

      <h6 className="mt-4">Leaderboard</h6>
      <table className="table table-sm small">
        <thead>
          <tr>
            <th>Agent</th>
            <th>Calls</th>
            <th>Connected</th>
            <th>PTP</th>
            <th>Kept</th>
            <th>Keep %</th>
          </tr>
        </thead>
        <tbody>
          {board.map((r) => (
            <tr key={r.agent}>
              <td>{r.agent}</td>
              <td>{r.calls}</td>
              <td>{r.connected}</td>
              <td>{r.ptp}</td>
              <td>{r.kept}</td>
              <td>{r.kept_rate}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
