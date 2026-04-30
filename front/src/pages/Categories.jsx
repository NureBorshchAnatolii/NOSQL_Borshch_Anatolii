import { useEffect, useState } from "react";
import api from "../../api/axios";
import { useAuth } from "../hooks/useAuth";

export default function Categories() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);

  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const [deletingId, setDeletingId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/categories");
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      setMsg({
        type: "error",
        text: err.response?.data?.message || "Failed to load categories",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    api
      .get("/categories")
      .then(({ data }) => {
        if (cancelled) return;
        setCategories(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (cancelled) return;
        setMsg({
          type: "error",
          text: err.response?.data?.message || "Failed to load categories",
        });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const create = async (e) => {
    e.preventDefault();
    setMsg(null);
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    try {
      await api.post("/categories", { name });
      setNewName("");
      await load();
      setMsg({ type: "success", text: "Category created" });
    } catch (err) {
      setMsg({
        type: "error",
        text: err.response?.data?.message || "Failed to create category",
      });
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (c) => {
    setEditingId(c._id);
    setEditName(c.name);
    setMsg(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };

  const saveEdit = async (id) => {
    const name = editName.trim();
    if (!name) return;
    setSavingEdit(true);
    setMsg(null);
    try {
      await api.put(`/categories/${id}`, { name });
      setEditingId(null);
      setEditName("");
      await load();
      setMsg({ type: "success", text: "Category updated" });
    } catch (err) {
      setMsg({
        type: "error",
        text: err.response?.data?.message || "Failed to update category",
      });
    } finally {
      setSavingEdit(false);
    }
  };

  const remove = async (c) => {
    if (!window.confirm(`Delete category "${c.name}"?`)) return;
    setDeletingId(c._id);
    setMsg(null);
    try {
      await api.delete(`/categories/${c._id}`);
      await load();
      setMsg({ type: "success", text: "Category deleted" });
    } catch (err) {
      setMsg({
        type: "error",
        text: err.response?.data?.message || "Failed to delete category",
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="container" style={{ padding: "32px 24px", maxWidth: 720 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: 8,
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1 style={{ fontSize: "2rem" }}>Categories</h1>
          <p style={{ color: "var(--ink-2)", marginTop: 4 }}>
            {isAdmin
              ? "Create, rename and delete test categories."
              : "Browse the available test categories."}
          </p>
        </div>
        <span style={{ fontSize: ".85rem", color: "var(--ink-2)" }}>
          {categories.length} total
        </span>
      </div>

      {msg && (
        <div className={`alert alert-${msg.type}`} style={{ margin: "16px 0" }}>
          {msg.text}
        </div>
      )}

      {isAdmin && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: "1.1rem", marginBottom: 12 }}>
            Add a category
          </h2>
          <form
            onSubmit={create}
            style={{ display: "flex", gap: 8, flexWrap: "wrap" }}
          >
            <input
              className="input"
              style={{ flex: "1 1 240px" }}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. JavaScript"
              required
            />
            <button
              className="btn btn-primary"
              type="submit"
              disabled={creating || !newName.trim()}
            >
              {creating ? "Adding…" : "Add"}
            </button>
          </form>
        </div>
      )}

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: 24, color: "var(--ink-2)" }}>Loading…</div>
        ) : categories.length === 0 ? (
          <div style={{ padding: 24, color: "var(--ink-2)" }}>
            No categories yet.
          </div>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {categories.map((c, i) => {
              const isEditing = editingId === c._id;
              return (
                <li
                  key={c._id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "14px 18px",
                    borderTop: i === 0 ? "none" : "1px solid var(--line)",
                    gap: 12,
                  }}
                >
                  {isEditing ? (
                    <input
                      className="input"
                      style={{ flex: 1 }}
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      autoFocus
                    />
                  ) : (
                    <span style={{ fontSize: ".95rem" }}>{c.name}</span>
                  )}

                  {isAdmin && (
                    <div style={{ display: "flex", gap: 6 }}>
                      {isEditing ? (
                        <>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => saveEdit(c._id)}
                            disabled={savingEdit || !editName.trim()}
                          >
                            {savingEdit ? "Saving…" : "Save"}
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={cancelEdit}
                            disabled={savingEdit}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => startEdit(c)}
                          >
                            Rename
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => remove(c)}
                            disabled={deletingId === c._id}
                            style={{ color: "#b00020" }}
                          >
                            {deletingId === c._id ? "Deleting…" : "Delete"}
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
