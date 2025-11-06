import React from "react";
import { Routes, Route } from "react-router-dom";
import NavBar from "./components/NavBar";
import Dashboard from "./pages/Dashboard";
import BorrowerDetail from "./pages/BorrowerDetail";
import CallSimulator from "./pages/CallSimulator";
import Policies from "./pages/Policies";
import NotFound from "./pages/NotFound";
import PaymentSimulator from "./pages/PaymentSimulator.jsx";
import Reports from "./pages/Reports.jsx";
import Queue from "./pages/Queue.jsx";
import WhatsAppNegotiate from "./pages/WhatsAppNegotiate.jsx";
export default function App() {
  return (
    <>
      <NavBar />
      <div className="container my-4">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/borrower/:id" element={<BorrowerDetail />} />
          <Route path="/call/:id" element={<CallSimulator />} />
          <Route path="/policies" element={<Policies />} />
          <Route path="*" element={<NotFound />} />
          <Route path="/pay/:id" element={<PaymentSimulator />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/queue" element={<Queue />} />
          <Route path="/whatsapp/:id" element={<WhatsAppNegotiate />} />
        </Routes>
      </div>
    </>
  );
}
