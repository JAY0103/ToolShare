import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { adminService, itemsService } from "../services/api";

const SECTIONS = [
  { key: "users", label: "Manage Users", icon: "bi-people-fill" },
  { key: "categories", label: "Manage Categories", icon: "bi-tag-fill" },
  { key: "faculties", label: "Manage Faculties", icon: "bi-building-fill" },
];

const ROLES = ["Student", "Faculty", "Admin"];

const roleBadge = (role) => {
  if (role === "Admin") return "bg-danger";
  if (role === "Faculty") return "bg-primary";
  return "bg-secondary";
};

const confirmAction = (msg) => window.confirm(msg);

const SectionHeader = ({ title, subtitle, action }) => (
  <div className="mb-4 d-flex flex-wrap justify-content-between align-items-start gap-3">
    <div>
      <h3 className="fw-bold mb-1">{title}</h3>
      <p className="text-muted small mb-0">{subtitle}</p>
    </div>
    {action ? <div>{action}</div> : null}
  </div>
);

// ══════════════════════════════════════════════════════════════════════════════
// USERS SECTION
// ══════════════════════════════════════════════════════════════════════════════
const UsersSection = ({ currentUserId }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState({});

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminService.getAllUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      alert(err.message || "Failed to load users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleRoleChange = async (userId, newRole) => {
    if (!confirmAction(`Change this user's role to ${newRole}?`)) return;

    setBusy((b) => ({ ...b, [userId]: true }));
    try {
      await adminService.updateUserRole(userId, newRole);
      await load();
    } catch (err) {
      alert(err.message || "Failed to update role");
    } finally {
      setBusy((b) => ({ ...b, [userId]: false }));
    }
  };

  const handleDelete = async (userId, name) => {
    if (!confirmAction(`Delete user "${name}"? This cannot be undone.`)) return;

    setBusy((b) => ({ ...b, [userId]: true }));
    try {
      await adminService.deleteUser(userId);
      await load();
    } catch (err) {
      alert(err.message || "Failed to delete user");
    } finally {
      setBusy((b) => ({ ...b, [userId]: false }));
    }
  };

  const filtered = users.filter((u) => {
    const q = search.trim().toLowerCase();
    return (
      !q ||
      String(u.first_name || "").toLowerCase().includes(q) ||
      String(u.last_name || "").toLowerCase().includes(q) ||
      String(u.email || "").toLowerCase().includes(q) ||
      String(u.username || "").toLowerCase().includes(q) ||
      String(u.student_id || "").toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <SectionHeader
        title="Manage Users"
        subtitle="View all registered users, change their roles, or remove them from the system."
      />

      <div className="mb-3" style={{ maxWidth: 360 }}>
        <input
          className="form-control"
          placeholder="Search by name, email, username, ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="text-muted py-4">Loading users...</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Student ID</th>
                <th>Role</th>
                <th style={{ width: 200 }}>Change Role</th>
                <th style={{ width: 80 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-muted py-4">
                    No users found.
                  </td>
                </tr>
              ) : (
                filtered.map((u) => {
                  const isSelf = u.user_id === currentUserId;
                  const name =
                    `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.username || "Unknown";

                  return (
                    <tr key={u.user_id}>
                      <td>
                        <div className="fw-semibold">{name}</div>
                        <div className="small text-muted">@{u.username}</div>
                      </td>
                      <td>{u.email}</td>
                      <td>{u.student_id || "—"}</td>
                      <td>
                        <span className={`badge ${roleBadge(u.user_type)}`}>
                          {u.user_type}
                        </span>
                      </td>
                      <td>
                        <select
                          className="form-select form-select-sm"
                          value={u.user_type}
                          disabled={busy[u.user_id] || isSelf}
                          onChange={(e) => handleRoleChange(u.user_id, e.target.value)}
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <button
                          className="btn btn-outline-danger btn-sm"
                          disabled={busy[u.user_id] || isSelf}
                          title={isSelf ? "Cannot delete your own account" : "Delete user"}
                          onClick={() => handleDelete(u.user_id, name)}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          <div className="small text-muted">
            {filtered.length} of {users.length} user(s) shown
          </div>
        </div>
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// CATEGORIES SECTION
// ══════════════════════════════════════════════════════════════════════════════
const CategoriesSection = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [description, setDesc] = useState("");
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState({});

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await itemsService.getCategories();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      alert(err.message || "Failed to load categories");
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setAdding(true);
    try {
      await adminService.createCategory(name.trim(), description.trim() || null);
      setName("");
      setDesc("");
      await load();
    } catch (err) {
      alert(err.message || "Failed to create category");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id, catName) => {
    if (
      !confirmAction(
        `Delete category "${catName}"? Items in this category will become uncategorized.`
      )
    ) {
      return;
    }

    setBusy((b) => ({ ...b, [id]: true }));
    try {
      await adminService.deleteCategory(id);
      await load();
    } catch (err) {
      alert(err.message || "Failed to delete category");
    } finally {
      setBusy((b) => ({ ...b, [id]: false }));
    }
  };

  return (
    <div>
      <SectionHeader
        title="Manage Categories"
        subtitle="Add new equipment categories or remove ones that are no longer needed."
      />

      <div className="card p-4 mb-4 shadow-sm" style={{ maxWidth: 520 }}>
        <h6 className="fw-bold mb-3">Add New Category</h6>
        <form onSubmit={handleAdd}>
          <div className="mb-3">
            <label className="form-label fw-semibold">
              Name <span className="text-danger">*</span>
            </label>
            <input
              className="form-control"
              placeholder="e.g. Audio Equipment"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">Description</label>
            <input
              className="form-control"
              placeholder="Optional description"
              value={description}
              onChange={(e) => setDesc(e.target.value)}
            />
          </div>

          <button
            className="btn btn-success fw-bold"
            type="submit"
            disabled={adding || !name.trim()}
          >
            {adding ? "Adding..." : "Add Category"}
          </button>
        </form>
      </div>

      <h6 className="fw-bold mb-3">Existing Categories</h6>

      {loading ? (
        <div className="text-muted">Loading...</div>
      ) : categories.length === 0 ? (
        <div className="text-muted">No categories yet.</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Description</th>
                <th style={{ width: 80 }}></th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.category_id}>
                  <td className="text-muted small">{c.category_id}</td>
                  <td className="fw-semibold">{c.name}</td>
                  <td className="text-muted small">{c.description || "—"}</td>
                  <td>
                    <button
                      className="btn btn-outline-danger btn-sm"
                      disabled={!!busy[c.category_id]}
                      onClick={() => handleDelete(c.category_id, c.name)}
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// FACULTIES SECTION
// ══════════════════════════════════════════════════════════════════════════════
const FacultiesSection = () => {
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [description, setDesc] = useState("");
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState({});

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminService.getFaculties();
      setFaculties(Array.isArray(data) ? data : []);
    } catch (err) {
      alert(err.message || "Failed to load faculties");
      setFaculties([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setAdding(true);
    try {
      await adminService.createFaculty(name.trim(), description.trim() || null);
      setName("");
      setDesc("");
      await load();
    } catch (err) {
      alert(err.message || "Failed to create faculty");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id, facName) => {
    if (!confirmAction(`Delete faculty "${facName}"?`)) return;

    setBusy((b) => ({ ...b, [id]: true }));
    try {
      await adminService.deleteFaculty(id);
      await load();
    } catch (err) {
      alert(err.message || "Failed to delete faculty");
    } finally {
      setBusy((b) => ({ ...b, [id]: false }));
    }
  };

  return (
    <div>
      <SectionHeader
        title="Manage Faculties"
        subtitle="Add or remove faculties/departments. Items are associated with a faculty."
      />

      <div className="card p-4 mb-4 shadow-sm" style={{ maxWidth: 520 }}>
        <h6 className="fw-bold mb-3">Add New Faculty</h6>
        <form onSubmit={handleAdd}>
          <div className="mb-3">
            <label className="form-label fw-semibold">
              Name <span className="text-danger">*</span>
            </label>
            <input
              className="form-control"
              placeholder="e.g. Engineering"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">Description</label>
            <input
              className="form-control"
              placeholder="Optional description"
              value={description}
              onChange={(e) => setDesc(e.target.value)}
            />
          </div>

          <button
            className="btn btn-success fw-bold"
            type="submit"
            disabled={adding || !name.trim()}
          >
            {adding ? "Adding..." : "Add Faculty"}
          </button>
        </form>
      </div>

      <h6 className="fw-bold mb-3">Existing Faculties</h6>

      {loading ? (
        <div className="text-muted">Loading...</div>
      ) : faculties.length === 0 ? (
        <div className="text-muted">No faculties yet.</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Description</th>
                <th style={{ width: 80 }}></th>
              </tr>
            </thead>
            <tbody>
              {faculties.map((f) => (
                <tr key={f.faculty_id}>
                  <td className="text-muted small">{f.faculty_id}</td>
                  <td className="fw-semibold">{f.name}</td>
                  <td className="text-muted small">{f.description || "—"}</td>
                  <td>
                    <button
                      className="btn btn-outline-danger btn-sm"
                      disabled={!!busy[f.faculty_id]}
                      onClick={() => handleDelete(f.faculty_id, f.name)}
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════
const AdminPanel = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("users");

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  })();

  useEffect(() => {
    if (!user || String(user.user_type || "").toLowerCase() !== "admin") {
      alert("Admin access only.");
      navigate("/home");
    }
  }, [user, navigate]);

  const renderContent = () => {
    if (activeSection === "users") {
      return <UsersSection currentUserId={user?.user_id} />;
    }
    if (activeSection === "categories") {
      return <CategoriesSection />;
    }
    if (activeSection === "faculties") {
      return <FacultiesSection />;
    }
    return null;
  };

  return (
    <div className="container-fluid px-0" style={{ minHeight: "calc(100vh - 130px)" }}>
      <div className="d-flex" style={{ minHeight: "inherit" }}>
        {/* Sidebar */}
        <div
          className="d-flex flex-column py-4 px-3"
          style={{
            width: 250,
            minWidth: 250,
            borderRight: "1px solid rgba(0,0,0,0.08)",
            background: "#f8f9fa",
          }}
        >
          <div className="mb-4 px-2">
            <div
              className="fw-bold"
              style={{
                fontSize: "0.8rem",
                color: "#6c757d",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Admin Panel
            </div>
            <div className="small text-muted mt-1">
              {user?.first_name} {user?.last_name}
            </div>
          </div>

          <nav className="d-flex flex-column gap-1">
            {SECTIONS.map((s) => (
              <button
                key={s.key}
                onClick={() => setActiveSection(s.key)}
                className="btn text-start d-flex align-items-center gap-2 fw-semibold"
                style={{
                  borderRadius: 10,
                  padding: "10px 14px",
                  fontSize: "0.95rem",
                  background: activeSection === s.key ? "#007847" : "transparent",
                  color: activeSection === s.key ? "#fff" : "#343a40",
                  border: "none",
                  transition: "background 0.15s, color 0.15s",
                }}
              >
                <i className={`bi ${s.icon}`} style={{ fontSize: 15 }}></i>
                {s.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div
          className="flex-grow-1 py-4 px-4"
          style={{
            minWidth: 0,
          }}
        >
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;