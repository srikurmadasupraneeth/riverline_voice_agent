import React from "react";
import { Link } from "react-router-dom";

export default function NavBar() {
  return (
    <nav className="navbar navbar-expand-lg bg-white">
      <div className="container">
        <Link className="navbar-brand d-flex align-items-center gap-2" to="/">
          <span className="brand-badge">Riverline</span>
          <span className="fw-semibold">Voice Collections</span>
        </Link>
        <div className="d-flex gap-2">
          <Link className="btn btn-sm btn-outline-primary" to="/">
            Dashboard
          </Link>
          <Link className="btn btn-sm btn-outline-secondary" to="/policies">
            Policies
          </Link>
          <Link className="btn btn-sm btn-outline-secondary" to="/queue">
            Queue
          </Link>
          <Link className="btn btn-sm btn-outline-secondary" to="/reports">
            Reports
          </Link>
        </div>
      </div>
    </nav>
  );
}
