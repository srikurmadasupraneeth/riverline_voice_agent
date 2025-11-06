// client/src/pages/CallSimulator.jsx
import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  fetchBorrower,
  startConversation,
  postUtter,
  setOutcome,
  scheduleFollowup,
  complianceCheck,
} from "../api";

const fmtINR = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);

export default function CallSimulator() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [b, setB] = useState(null);
  const [conv, setConv] = useState(null);
  const [tone, setTone] = useState("empathetic");
  const [text, setText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [follow, setFollow] = useState("");
  const recRef = useRef(null);
  const transcriptEndRef = useRef(null); // Ref for auto-scrolling

  useEffect(() => {
    fetchBorrower(id).then(setB);
  }, [id]);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conv?.turns]);

  const speak = (t) => {
    const u = new SpeechSynthesisUtterance(t);
    u.lang =
      b?.language === "hi" ? "hi-IN" : b?.language === "te" ? "te-IN" : "en-IN";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  };

  const ensureRec = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return alert("Speech recognition only works in Chrome.");
    if (recRef.current) return recRef.current;
    const r = new SR();
    r.lang =
      b?.language === "hi" ? "hi-IN" : b?.language === "te" ? "te-IN" : "en-IN";
    r.onresult = async (e) => {
      const msg = e.results[0][0].transcript;
      await send(msg);
    };
    r.onend = () => setIsListening(false);
    recRef.current = r;
    return r;
  };

  const listen = () => {
    const r = ensureRec();
    if (!r) return;
    setIsListening(true);
    r.start();
  };

  const stop = () => {
    recRef.current?.stop();
    setIsListening(false);
  };

  const begin = async () => {
    const cc = await complianceCheck();
    if (!cc.ok)
      alert(
        `⚠ Outside safe calling window (${cc.window}) — continuing demo only`
      );
    const c = await startConversation(id, { tone });
    setConv(c);
    const firstAgentMsg = c.turns[c.turns.length - 1].text;
    speak(firstAgentMsg);
  };

  const send = async (msg) => {
    const out = msg || text;
    if (!out.trim() || !conv) return;

    const updated = await postUtter(conv._id, out);
    setConv(updated);

    const lastAgent = updated.turns[updated.turns.length - 1];
    if (lastAgent?.role === "agent") speak(lastAgent.text);

    setText("");

    // Live coaching + auto tone shift
    const lastCoach = updated.coaching;
    if (lastCoach && lastCoach.sent === "negative" && tone !== "empathetic") {
      setTone("empathetic");
    }
  };

  if (!b) return <div>Loading…</div>;

  return (
    <div className="row g-3">
      <div className="col-lg-4">
        <div className="card p-3 shadow-sm">
          <h5>Call with {b.name}</h5>
          <div className="small text-muted mb-2">
            Amount Due: {fmtINR(b.amount_due || b.emi_amount)}
          </div>

          {!conv ? (
            <>
              <label className="small text-muted">Agent Tone</label>
              <select
                className="form-select form-select-sm"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
              >
                <option value="empathetic">Empathetic</option>
                <option value="neutral">Neutral</option>
                <option value="urgent">Urgent</option>
              </select>

              <button className="btn btn-primary w-100 mt-3" onClick={begin}>
                Start Voice Call
              </button>
            </>
          ) : (
            <>
              <div className="input-group mt-3">
                <input
                  className="form-control"
                  placeholder="Say or type… e.g. ₹1200 next Friday"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && send()}
                />
                <button className="btn btn-primary" onClick={() => send()}>
                  Send
                </button>
              </div>

              {!isListening ? (
                <button
                  className="btn btn-outline-secondary w-100 mt-2"
                  onClick={listen}
                >
                  🎤 Speak as Borrower
                </button>
              ) : (
                <button className="btn btn-danger w-100 mt-2" onClick={stop}>
                  ⛔ Stop Listening
                </button>
              )}

              {conv && (
                <button
                  className="btn btn-outline-secondary btn-sm mt-2 w-100"
                  onClick={() => {
                    const url = `${window.location.origin}/borrower/${b._id}?conv=${conv._id}`;
                    navigator.clipboard.writeText(url);
                    alert("✅ Borrower 360 summary link copied");
                  }}
                >
                  🔗 Copy Borrower 360 Summary Link
                </button>
              )}

              <hr />

              <label className="small text-muted">Call Outcome</label>
              <div className="d-flex gap-2 flex-wrap">
                <button
                  onClick={() => setOutcome(conv._id, "connected")}
                  className="btn btn-sm btn-outline-primary"
                >
                  Connected
                </button>
                <button
                  onClick={() => setOutcome(conv._id, "no_answer")}
                  className="btn btn-sm btn-outline-secondary"
                >
                  No Answer
                </button>
                <button
                  onClick={() => setOutcome(conv._id, "busy")}
                  className="btn btn-sm btn-outline-secondary"
                >
                  Busy
                </button>
                <button
                  onClick={() => setOutcome(conv._id, "voicemail")}
                  className="btn btn-sm btn-outline-secondary"
                >
                  Voicemail
                </button>
              </div>

              <div className="mt-3">
                <label className="small text-muted">Schedule follow-up</label>
                <div className="input-group">
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={follow}
                    onChange={(e) => setFollow(e.target.value)}
                  />
                  <button
                    className="btn btn-outline-primary"
                    onClick={async () => {
                      await scheduleFollowup(
                        conv._id,
                        new Date(follow).toISOString()
                      );
                      alert("Follow-up scheduled ✅");
                    }}
                  >
                    Save
                  </button>
                </div>
              </div>

              <button
                className="btn btn-outline-dark btn-sm mt-3 w-100"
                onClick={() => navigate(`/borrower/${b._id}?conv=${conv._id}`)}
              >
                📊 Open Borrower 360 Summary
              </button>
            </>
          )}
        </div>
      </div>

      {/* Transcript and Coaching */}
      <div className="col-lg-8">
        <div className="card p-3 shadow-sm">
          <h6>Transcript</h6>
          <div style={{ maxHeight: 460, overflowY: "auto" }} className="small">
            {conv?.turns?.map((t, i) => (
              <div key={i} className="my-2">
                <strong
                  className={t.role === "agent" ? "text-primary" : "text-dark"}
                >
                  {t.role === "agent" ? "Agent: " : "Borrower: "}
                </strong>
                {t.text}
              </div>
            ))}
            <div ref={transcriptEndRef} /> {/* Auto-scroll target */}
          </div>

          {/* Coaching Panel */}
          {conv?.coaching && (
            <div className="alert alert-light border small mt-2">
              {/* ✅ NEW: LLM Suggestion */}
              {conv.coaching.llm_suggestion && (
                <div className="mb-2">
                  <strong>LLM Suggestion:</strong>
                  <div className="text-success fw-bold">
                    "{conv.coaching.llm_suggestion}"
                  </div>
                </div>
              )}

              <div>
                <strong>Coach:</strong> Sentiment{" "}
                <span className="badge bg-secondary">{conv.coaching.sent}</span>{" "}
                • Noise {Math.round((conv.coaching.noise || 0) * 100)}%
              </div>
              <ul className="mb-0">
                {conv.coaching.tips?.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
