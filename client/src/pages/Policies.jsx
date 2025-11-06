import React, { useEffect, useState } from "react";
import { getPolicies, upsertPolicy } from "../api";

export default function Policies() {
  const [policies, setPolicies] = useState([]);
  const [configValue, setConfigValue] = useState("");

  useEffect(() => {
    getPolicies().then((res) => {
      setPolicies(res);
      setConfigValue(JSON.stringify(res[0]?.config || {}, null, 2));
    });
  }, []);

  const save = async () => {
    try {
      const config = JSON.parse(configValue);
      await upsertPolicy(policies[0]._id, config);
      alert("Policy updated");
    } catch {
      alert("Invalid JSON!");
    }
  };

  return (
    <div className="card p-4 shadow-sm">
      <h4 className="fw-bold mb-3">Policy Settings</h4>
      <div className="small text-muted mb-3">
        Configure rules for safe & compliant outreach.
      </div>

      <textarea
        className="form-control"
        rows="10"
        value={configValue}
        onChange={(e) => setConfigValue(e.target.value)}
      />

      <button className="btn btn-primary mt-3" onClick={save}>
        Save Policy
      </button>
    </div>
  );
}
