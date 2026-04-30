import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import api from "../../api/axios";

export default function TakeTest() {
  const { testId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();

  const [attempt, setAttempt] = useState(state?.attempt || null);
  const [test, setTest] = useState(state?.test || null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(!state);

  useEffect(() => {
    if (state) return;
    api
      .post("/attempts/start", { testId })
      .then(({ data }) => {
        setAttempt(data.attempt);
        setTest(data.test);
      })
      .catch(() => navigate("/tests"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner" />;
  if (!test || !attempt) return null;

  const questions = test.questions || [];
  const q = questions[current];
  const total = questions.length;
  const answered = Object.keys(answers).length;
  const progress = Math.round((answered / total) * 100);

  const selectAnswer = (qId, val) => setAnswers((a) => ({ ...a, [qId]: val }));

  const finish = async () => {
    setSubmitting(true);
    try {
      for (const [questionId, val] of Object.entries(answers)) {
        const q = questions.find((q) => q._id === questionId);
        if (!q) continue;
        await api.post(`/attempts/${attempt._id}/answer`, {
          questionId,
          ...(q.questionType === "text"
            ? { textAnswer: val }
            : { selectedAnswerId: val }),
        });
      }
      const { data } = await api.post(`/attempts/${attempt._id}/finish`);
      setResult(data);
    } catch (err) {
      alert(err.response?.data?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    const passed = result.passed;
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <div style={{ width: "100%", maxWidth: 480, textAlign: "center" }}>
          <h1 style={{ fontSize: "2.5rem", marginBottom: 8 }}>
            {result.percentage}%
          </h1>
          <p style={{ color: "var(--ink-2)", marginBottom: 24 }}>
            {result.score} / {result.maxScore} points · passing score{" "}
            {result.passingScore}%
          </p>

          <div
            className={`alert ${passed ? "alert-success" : "alert-error"}`}
            style={{ marginBottom: 32, textAlign: "center" }}
          >
            {passed ? "You passed!" : "Not quite — keep practising"}
          </div>

          <div className="progress-bar" style={{ marginBottom: 32 }}>
            <div
              className="progress-fill"
              style={{
                width: `${result.percentage}%`,
                background: passed ? "var(--success)" : "var(--danger)",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button
              className="btn btn-ghost"
              onClick={() => navigate("/tests")}
            >
              Browse tests
            </button>
            <button
              className="btn btn-primary"
              onClick={() => window.location.reload()}
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--surface)" }}>
      <div
        style={{
          background: "var(--white)",
          borderBottom: "1px solid var(--line)",
          padding: "12px 0",
        }}
      >
        <div
          className="container"
          style={{ display: "flex", alignItems: "center", gap: 20 }}
        >
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => navigate("/tests")}
          >
            ← Exit
          </button>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: ".8rem",
                color: "var(--ink-3)",
                marginBottom: 4,
              }}
            >
              {test.title} · {answered}/{total} answered
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <span
            style={{
              fontSize: ".85rem",
              color: "var(--ink-2)",
              whiteSpace: "nowrap",
            }}
          >
            {current + 1} / {total}
          </span>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 720, paddingTop: 48 }}>
        <div className="card" style={{ marginBottom: 20 }}>
          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "flex-start",
              marginBottom: 24,
            }}
          >
            <span
              className="badge badge-gray"
              style={{ flexShrink: 0, marginTop: 2 }}
            >
              Q{current + 1}
            </span>
            <h2
              style={{
                fontSize: "1.2rem",
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 500,
                lineHeight: 1.5,
              }}
            >
              {q.text}
            </h2>
          </div>

          <div
            style={{
              fontSize: ".8rem",
              color: "var(--ink-3)",
              marginBottom: 20,
            }}
          >
            {q.points} point{q.points !== 1 ? "s" : ""} ·{" "}
            {q.questionType === "single"
              ? "Single choice"
              : q.questionType === "multiple"
                ? "Multiple choice"
                : "Open answer"}
          </div>

          {q.questionType === "text" ? (
            <textarea
              className="input"
              placeholder="Type your answer here…"
              rows={5}
              value={answers[q._id] || ""}
              onChange={(e) => selectAnswer(q._id, e.target.value)}
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {q.answers?.map((ans) => {
                const selected = answers[q._id] === ans._id;
                return (
                  <label
                    key={ans._id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "12px 16px",
                      borderRadius: 8,
                      cursor: "pointer",
                      border: `1.5px solid ${selected ? "var(--accent)" : "var(--line)"}`,
                      background: selected ? "#eff6ff" : "var(--white)",
                      transition: "all .12s",
                    }}
                  >
                    <input
                      type={
                        q.questionType === "multiple" ? "checkbox" : "radio"
                      }
                      name={q._id}
                      checked={selected}
                      onChange={() => selectAnswer(q._id, ans._id)}
                      style={{
                        accentColor: "var(--accent)",
                        width: 16,
                        height: 16,
                      }}
                    />
                    <span style={{ fontSize: ".9375rem" }}>{ans.text}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingBottom: 48,
          }}
        >
          <button
            className="btn btn-ghost"
            onClick={() => setCurrent((c) => c - 1)}
            disabled={current === 0}
          >
            ← Previous
          </button>
          <div
            style={{
              display: "flex",
              gap: 6,
              flexWrap: "wrap",
              justifyContent: "center",
              flex: 1,
              padding: "0 16px",
            }}
          >
            {questions.map((qq, i) => (
              <button
                key={qq._id}
                onClick={() => setCurrent(i)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  border: "none",
                  cursor: "pointer",
                  fontSize: ".75rem",
                  fontWeight: 500,
                  background:
                    i === current
                      ? "var(--ink)"
                      : answers[qq._id]
                        ? "var(--accent)"
                        : "var(--line)",
                  color:
                    i === current || answers[qq._id]
                      ? "var(--white)"
                      : "var(--ink-2)",
                  transition: "all .12s",
                }}
              >
                {i + 1}
              </button>
            ))}
          </div>

          {current < total - 1 ? (
            <button
              className="btn btn-primary"
              onClick={() => setCurrent((c) => c + 1)}
            >
              Next →
            </button>
          ) : (
            <button
              className="btn btn-accent"
              onClick={finish}
              disabled={submitting}
              style={{ minWidth: 120 }}
            >
              {submitting ? "Submitting…" : "Finish test"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
