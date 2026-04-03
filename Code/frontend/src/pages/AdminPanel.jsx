import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { adminService, itemsService } from "../services/api";

const SECTIONS = [
  { key: "users", label: "Manage Users", icon: "bi-people-fill" },
  { key: "categories", label: "Manage Categories", icon: "bi-tag-fill" },
  { key: "faculties", label: "Manage Faculties", icon: "bi-building-fill" },
];

const ROLES = ["Student", "Faculty", "Admin"];

const roleBadgeStyles = (role) => {
  if (role === "Admin") {
    return {
      background: "#fee2e2",
      color: "#b91c1c",
      border: "1px solid #fecaca",
    };
  }
  if (role === "Faculty") {
    return {
      background: "#dbeafe",
      color: "#1d4ed8",
      border: "1px solid #bfdbfe",
    };
  }
  return {
    background: "#f3f4f6",
    color: "#374151",
    border: "1px solid #e5e7eb",
  };
};

const confirmAction = (msg) => window.confirm(msg);

const pageShellStyle = {
  minHeight: "calc(100vh - 120px)",
  background: "#f5f7fb",
  padding: "24px",
};

const cardStyle = {
  background: "#ffffff",
  border: "1px solid #e9edf5",
  borderRadius: "20px",
  boxShadow: "0 10px 30px rgba(16, 24, 40, 0.06)",
};

const innerCardStyle = {
  background: "#ffffff",
  border: "1px solid #edf1f7",
  borderRadius: "16px",
  boxShadow: "0 6px 18px rgba(16, 24, 40, 0.04)",
};

const tableWrapStyle = {
  background: "#fff",
  border: "1px solid #edf1f7",
  borderRadius: "16px",
  overflow: "hidden",
};

const inputStyle = {
  borderRadius: "12px",
  minHeight: "44px",
  border: "1px solid #dbe3ef",
  boxShadow: "none",
};

const SectionHeader = ({ title, subtitle, action }) => (
  <div className="mb-4 d-flex flex-wrap justify-content-between align-items-start gap-3">
    <div>
      <h2
        className="fw-bold mb-1"
        style={{ fontSize: "1.75rem", color: "#111827", letterSpacing: "-0.02em" }}
      >
        {title}
      </h2>
      <p className="mb-0" style={{ color: "#6b7280", fontSize: "0.98rem" }}>
        {subtitle}
      </p>
    </div>
    {action ? <div>{action}</div> : null}
  </div>
);

const StatsStrip = ({ items }) => (
  <div className="row g-3 mb-4">
    {items.map((item, index) => (
      <div key={index} className="col-12 col-md-4">
        <div
          style={{
            ...innerCardStyle,
            padding: "18px 20px",
            height: "100%",
          }}
        >
          <div
            className="small fw-semibold mb-1"
            style={{
              color: "#6b7280",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              fontSize: "0.72rem",
            }}
          >
            {item.label}
          </div>
          <div
            className="fw-bold"
            style={{ fontSize: "1.6rem", color: "#111827", lineHeight: 1.2 }}
          >
            {item.value}
          </div>
          {item.helper ? (
            <div className="small mt-1" style={{ color: "#9ca3af" }}>
              {item.helper}
            </div>
          ) : null}
        </div>
      </div>
    ))}
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
      String(u.student_id || "").toLowerCase().includes(q) ||
      String(u.user_id || "").toLowerCase().includes(q)
    );
  });

  const totalUsers = users.length;
  const totalStudents = users.filter(
    (u) => String(u.user_type || "").toLowerCase() === "student"
  ).length;
  const totalStaff = users.filter((u) =>
    ["faculty", "admin"].includes(String(u.user_type || "").toLowerCase())
  ).length;

  return (
    <div>
      <SectionHeader
        title="Manage Users"
        subtitle="View all registered users, update roles, and manage account access."
      />

      <StatsStrip
        items={[
          { label: "Total Users", value: totalUsers, helper: "All registered accounts" },
          { label: "Students", value: totalStudents, helper: "Student users in system" },
          { label: "Faculty + Admin", value: totalStaff, helper: "Staff-side access roles" },
        ]}
      />

      <div className="mb-4" style={{ maxWidth: 420 }}>
        <input
          className="form-control"
          style={inputStyle}
          placeholder="Search by name, email, username, ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div style={{ ...cardStyle, padding: "28px" }}>
          <div className="text-muted">Loading users...</div>
        </div>
      ) : (
        <div style={tableWrapStyle}>
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead style={{ background: "#f8fafc" }}>
                <tr>
                  <th className="px-4 py-3" style={{ color: "#374151", fontWeight: 700 }}>
                    Name
                  </th>
                  <th className="px-4 py-3" style={{ color: "#374151", fontWeight: 700 }}>
                    Email
                  </th>
                  <th className="px-4 py-3" style={{ color: "#374151", fontWeight: 700 }}>
                    Student ID
                  </th>
                  <th className="px-4 py-3" style={{ color: "#374151", fontWeight: 700 }}>
                    Role
                  </th>
                  <th
                    className="px-4 py-3"
                    style={{ color: "#374151", fontWeight: 700, width: 220 }}
                  >
                    Change Role
                  </th>
                  <th className="px-4 py-3" style={{ width: 90 }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center text-muted py-5">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((u) => {
                    const isSelf = u.user_id === currentUserId;
                    const name =
                      `${u.first_name || ""} ${u.last_name || ""}`.trim() ||
                      u.username ||
                      "Unknown";

                    return (
                      <tr key={u.user_id} style={{ borderTop: "1px solid #f1f5f9" }}>
                        <td className="px-4 py-3">
                          <div className="fw-semibold" style={{ color: "#111827" }}>
                            {name}
                          </div>
                          <div className="small" style={{ color: "#6b7280" }}>
                            @{u.username || "unknown"}
                          </div>
                        </td>
                        <td className="px-4 py-3" style={{ color: "#111827" }}>
                          {u.email}
                        </td>
                        <td className="px-4 py-3" style={{ color: "#111827" }}>
                          {u.student_id || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="badge"
                            style={{
                              ...roleBadgeStyles(u.user_type),
                              borderRadius: "999px",
                              padding: "8px 12px",
                              fontWeight: 700,
                              fontSize: "0.78rem",
                            }}
                          >
                            {u.user_type}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            className="form-select form-select-sm"
                            style={{ ...inputStyle, minHeight: "40px" }}
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
                        <td className="px-4 py-3">
                          <button
                            className="btn btn-sm"
                            disabled={busy[u.user_id] || isSelf}
                            title={isSelf ? "Cannot delete your own account" : "Delete user"}
                            onClick={() => handleDelete(u.user_id, name)}
                            style={{
                              borderRadius: "12px",
                              width: "42px",
                              height: "42px",
                              border: "1px solid #fecaca",
                              background: "#fff5f5",
                              color: "#dc2626",
                            }}
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
          </div>

          <div
            className="px-4 py-3 small"
            style={{ borderTop: "1px solid #f1f5f9", color: "#6b7280" }}
          >
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
        subtitle="Create new equipment categories and remove categories no longer needed."
      />

      <div className="row g-4">
        <div className="col-12 col-xl-5">
          <div style={{ ...cardStyle, padding: "24px" }}>
            <h5 className="fw-bold mb-3" style={{ color: "#111827" }}>
              Add New Category
            </h5>
            <form onSubmit={handleAdd}>
              <div className="mb-3">
                <label className="form-label fw-semibold">
                  Name <span className="text-danger">*</span>
                </label>
                <input
                  className="form-control"
                  style={inputStyle}
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
                  style={inputStyle}
                  placeholder="Optional description"
                  value={description}
                  onChange={(e) => setDesc(e.target.value)}
                />
              </div>

              <button
                className="btn fw-bold"
                type="submit"
                disabled={adding || !name.trim()}
                style={{
                  background: "#007847",
                  color: "#fff",
                  borderRadius: "12px",
                  padding: "10px 18px",
                  border: "none",
                }}
              >
                {adding ? "Adding..." : "Add Category"}
              </button>
            </form>
          </div>
        </div>

        <div className="col-12 col-xl-7">
          <div style={tableWrapStyle}>
            <div className="px-4 py-3" style={{ borderBottom: "1px solid #eef2f7" }}>
              <h6 className="fw-bold mb-0" style={{ color: "#111827" }}>
                Existing Categories
              </h6>
            </div>

            {loading ? (
              <div className="p-4 text-muted">Loading...</div>
            ) : categories.length === 0 ? (
              <div className="p-4 text-muted">No categories yet.</div>
            ) : (
              <div className="table-responsive">
                <table className="table align-middle mb-0">
                  <thead style={{ background: "#f8fafc" }}>
                    <tr>
                      <th className="px-4 py-3">ID</th>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Description</th>
                      <th className="px-4 py-3" style={{ width: 90 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((c) => (
                      <tr key={c.category_id} style={{ borderTop: "1px solid #f1f5f9" }}>
                        <td className="px-4 py-3 text-muted small">{c.category_id}</td>
                        <td className="px-4 py-3 fw-semibold">{c.name}</td>
                        <td className="px-4 py-3 text-muted small">{c.description || "—"}</td>
                        <td className="px-4 py-3">
                          <button
                            className="btn btn-sm"
                            disabled={!!busy[c.category_id]}
                            onClick={() => handleDelete(c.category_id, c.name)}
                            style={{
                              borderRadius: "12px",
                              width: "42px",
                              height: "42px",
                              border: "1px solid #fecaca",
                              background: "#fff5f5",
                              color: "#dc2626",
                            }}
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
        </div>
      </div>
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
        subtitle="Add or remove faculties or departments used to organize inventory."
      />

      <div className="row g-4">
        <div className="col-12 col-xl-5">
          <div style={{ ...cardStyle, padding: "24px" }}>
            <h5 className="fw-bold mb-3" style={{ color: "#111827" }}>
              Add New Faculty
            </h5>
            <form onSubmit={handleAdd}>
              <div className="mb-3">
                <label className="form-label fw-semibold">
                  Name <span className="text-danger">*</span>
                </label>
                <input
                  className="form-control"
                  style={inputStyle}
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
                  style={inputStyle}
                  placeholder="Optional description"
                  value={description}
                  onChange={(e) => setDesc(e.target.value)}
                />
              </div>

              <button
                className="btn fw-bold"
                type="submit"
                disabled={adding || !name.trim()}
                style={{
                  background: "#007847",
                  color: "#fff",
                  borderRadius: "12px",
                  padding: "10px 18px",
                  border: "none",
                }}
              >
                {adding ? "Adding..." : "Add Faculty"}
              </button>
            </form>
          </div>
        </div>

        <div className="col-12 col-xl-7">
          <div style={tableWrapStyle}>
            <div className="px-4 py-3" style={{ borderBottom: "1px solid #eef2f7" }}>
              <h6 className="fw-bold mb-0" style={{ color: "#111827" }}>
                Existing Faculties
              </h6>
            </div>

            {loading ? (
              <div className="p-4 text-muted">Loading...</div>
            ) : faculties.length === 0 ? (
              <div className="p-4 text-muted">No faculties yet.</div>
            ) : (
              <div className="table-responsive">
                <table className="table align-middle mb-0">
                  <thead style={{ background: "#f8fafc" }}>
                    <tr>
                      <th className="px-4 py-3">ID</th>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Description</th>
                      <th className="px-4 py-3" style={{ width: 90 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {faculties.map((f) => (
                      <tr key={f.faculty_id} style={{ borderTop: "1px solid #f1f5f9" }}>
                        <td className="px-4 py-3 text-muted small">{f.faculty_id}</td>
                        <td className="px-4 py-3 fw-semibold">{f.name}</td>
                        <td className="px-4 py-3 text-muted small">{f.description || "—"}</td>
                        <td className="px-4 py-3">
                          <button
                            className="btn btn-sm"
                            disabled={!!busy[f.faculty_id]}
                            onClick={() => handleDelete(f.faculty_id, f.name)}
                            style={{
                              borderRadius: "12px",
                              width: "42px",
                              height: "42px",
                              border: "1px solid #fecaca",
                              background: "#fff5f5",
                              color: "#dc2626",
                            }}
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
        </div>
      </div>
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
    <div style={pageShellStyle}>
      <div className="row g-4">
        {/* Sidebar */}
        <div className="col-12 col-lg-3 col-xl-2">
          <div
            style={{
              ...cardStyle,
              padding: "20px 16px",
              position: "sticky",
              top: "20px",
            }}
          >
            <div className="px-2 mb-4">
              <div
                className="fw-bold"
                style={{
                  fontSize: "0.76rem",
                  color: "#6b7280",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                Admin Panel
              </div>
              <div
                className="mt-2 fw-semibold"
                style={{ color: "#111827", fontSize: "1rem", lineHeight: 1.3 }}
              >
                {user?.first_name} {user?.last_name}
              </div>
              <div className="small mt-1" style={{ color: "#6b7280" }}>
                Administrative controls
              </div>
            </div>

            <nav className="d-flex flex-column gap-2">
              {SECTIONS.map((s) => {
                const active = activeSection === s.key;
                return (
                  <button
                    key={s.key}
                    onClick={() => setActiveSection(s.key)}
                    className="btn text-start d-flex align-items-center gap-3 fw-semibold"
                    style={{
                      borderRadius: "14px",
                      padding: "12px 14px",
                      fontSize: "0.95rem",
                      background: active ? "#007847" : "#f8fafc",
                      color: active ? "#fff" : "#374151",
                      border: active ? "1px solid #007847" : "1px solid #e5e7eb",
                      boxShadow: active ? "0 10px 20px rgba(0, 120, 71, 0.16)" : "none",
                    }}
                  >
                    <i className={`bi ${s.icon}`} style={{ fontSize: 15 }}></i>
                    <span>{s.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="col-12 col-lg-9 col-xl-10">
          <div style={{ ...cardStyle, padding: "28px" }}>{renderContent()}</div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;