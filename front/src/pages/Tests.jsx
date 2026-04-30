import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { useAuth } from "../hooks/useAuth";

const statusBadge = {
  completed: "badge-green",
  "in-progress": "badge-orange",
  abandoned: "badge-red",
};

export default function Tests() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tests, setTests] = useState([]);
  const [categories, setCategories] = useState([]);
  const [attempts, setAttempts] = useState({});
  const [catFilter, setCatFilter] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/tests"),
      api.get("/categories"),
      api.get("/attempts"),
    ])
      .then(([t, c, a]) => {
        setTests(t.data);
        setCategories(c.data);
        const map = {};
        a.data.forEach((att) => {
          const tid = att.testId?._id || att.testId;
          if (
            !map[tid] ||
            new Date(att.startedAt) > new Date(map[tid].startedAt)
          )
            map[tid] = att;
        });
        setAttempts(map);
      })
      .finally(() => setLoading(false));
  }, []);

  const startTest = async (testId) => {
    try {
      const { data } = await api.post("/attempts/start", { testId });
      navigate(`/tests/${testId}/take`, {
        state: { attempt: data.attempt, test: data.test },
      });
    } catch (err) {
      alert(err.response?.data?.message || "Could not start test");
    }
  };

  const editTest = (testId) => {
    navigate(`/builder?edit=${testId}`);
  };

  const deleteTest = async (testId) => {
    if (!window.confirm("Delete this test? This cannot be undone.")) return;
    try {
      await api.delete(`/tests/${testId}`);
      setTests((ts) => ts.filter((t) => t._id !== testId));
    } catch (err) {
      alert(err.response?.data?.message || "Could not delete test");
    }
  };

  const filtered = tests.filter((t) => {
    const matchCat =
      !catFilter || (t.categoryId?._id || t.categoryId) === catFilter;
    const matchQ =
      !search || t.title.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchQ;
  });

  if (loading) return <div className="spinner" />;

  return (
    <div className="container page">
      <div
        className="page-header"
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <h1>Browse Tests</h1>
          <p>Pick a topic and start practising</p>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <input
            className="input"
            style={{ width: 220 }}
            placeholder="Search tests…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="input"
            style={{ width: 180 }}
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty">
          <h3>No tests found</h3>
          <p>Try a different search or category</p>
        </div>
      ) : (
        <div className="grid-2">
          {filtered.map((test) => {
            const catName = test.categoryId?.name || "—";
            const attempt = attempts[test._id];
            const qCount = test.questions?.length ?? 0;

            return (
              <div
                key={test._id}
                className="card"
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <span className="badge badge-blue">{catName}</span>
                  {attempt && (
                    <span
                      className={`badge ${statusBadge[attempt.status] || "badge-gray"}`}
                    >
                      {attempt.status === "completed"
                        ? `${Math.round((attempt.score / attempt.maxScore) * 100)}%`
                        : attempt.status}
                    </span>
                  )}
                </div>

                <div>
                  <h3
                    style={{
                      fontFamily: "'DM Serif Display', serif",
                      fontSize: "1.25rem",
                      fontWeight: 400,
                    }}
                  >
                    {test.title}
                  </h3>
                  {test.description && (
                    <p
                      style={{
                        color: "var(--ink-2)",
                        fontSize: ".875rem",
                        marginTop: 4,
                      }}
                    >
                      {test.description}
                    </p>
                  )}
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 20,
                    fontSize: ".8rem",
                    color: "var(--ink-3)",
                  }}
                >
                  <span>
                    {qCount} question{qCount !== 1 ? "s" : ""}
                  </span>
                  <span>Pass: {test.passingScore}%</span>
                  {attempt?.attemptNumber && (
                    <span>Attempt #{attempt.attemptNumber}</span>
                  )}
                </div>

                <hr className="divider" style={{ margin: "4px 0" }} />

                <button
                  className={`btn btn-full ${attempt?.status === "in-progress" ? "btn-accent" : "btn-primary"}`}
                  onClick={() => startTest(test._id)}
                >
                  {attempt?.status === "in-progress"
                    ? "Continue test"
                    : attempt?.status === "completed"
                      ? "Retake test"
                      : "Start test"}
                </button>

                {(() => {
                  const ownerId = test.userId?._id || test.userId;
                  const canManage =
                    user && (user.role === "admin" || ownerId === user._id);
                  if (!canManage) return null;
                  return (
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ flex: 1 }}
                        onClick={() => editTest(test._id)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ flex: 1, color: "var(--danger, #b00020)" }}
                        onClick={() => deleteTest(test._id)}
                      >
                        Delete
                      </button>
                    </div>
                  );
                })()}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
