import { useEffect, useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import { supabase } from "../../supabase";
import { Spinner } from "../../components/Spinner";
import { useToast } from "../../context/ToastContext";
import { colors, spacing, borderRadius, cardStyle as themeCard, inputStyle as themeInput, buttonPrimary, buttonSecondary } from "../../styles/theme";

function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const { addToast } = useToast();

  const [form, setForm] = useState({
    title: "",
    description: ""
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    const startTime = Date.now();
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (err) {
      // Error handled silently
    } finally {
      // Ensure minimum 3 seconds loading time
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 3000 - elapsed);
      setTimeout(() => {
        setLoading(false);
      }, remaining);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title.trim()) {
      addToast("Please enter project title", "error");
      return;
    }

    try {
      setSubmitting(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      if (editingId) {
        // Update existing
        const { error } = await supabase
          .from("projects")
          .update({ title: form.title, description: form.description })
          .eq("id", editingId);

        if (error) throw error;
        addToast("Project updated successfully!", "success");
      } else {
        // Create new
        const { error } = await supabase.from("projects").insert([{
          title: form.title,
          description: form.description,
          created_by: user?.id
        }]);

        if (error) throw error;
        addToast("Project created successfully!", "success");
      }

      setForm({ title: "", description: "" });
      setShowForm(false);
      setEditingId(null);
      fetchProjects();
    } catch (err) {
      addToast("Failed to save project", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (project) => {
    setForm({ title: project.title, description: project.description || "" });
    setEditingId(project.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this project?")) return;

    try {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;
      addToast("Project deleted", "success");
      fetchProjects();
    } catch (err) {
      addToast("Failed to delete project", "error");
    }
  };

  const cancelEdit = () => {
    setForm({ title: "", description: "" });
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <AdminLayout>
      {/* Header (icon removed) */}
      <div style={headerContainer}>
        <div style={headerSection}>
          <div>
            <h1 style={pageTitle}>Projects</h1>
            <p style={pageSubtitle}>Manage funded projects and initiatives</p>
          </div>
        </div>
        <button onClick={() => { setShowForm(!showForm); if (showForm) cancelEdit(); }} style={primaryBtn}>
          {showForm ? "Cancel" : "+ Add Project"}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div style={{ ...themeCard, marginBottom: spacing.lg }}>
          <h3 style={formTitle}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
            {editingId ? "Edit Project" : "New Project"}
          </h3>
          <form onSubmit={handleSubmit}>
            <div style={formGroup}>
              <label style={labelStyle}>Project Title <span style={requiredStar}>*</span></label>
              <input
                name="title"
                placeholder="E.g., Community Workshop Series"
                value={form.title}
                onChange={handleChange}
                style={inputStyle}
              />
            </div>
            <div style={formGroup}>
              <label style={labelStyle}>Description</label>
              <textarea
                name="description"
                placeholder="Describe the project goals and progress..."
                value={form.description}
                onChange={handleChange}
                rows={3}
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </div>
            <div style={formActions}>
              {editingId && (
                <button type="button" onClick={cancelEdit} style={secondaryBtn}>
                  Cancel Edit
                </button>
              )}
              <button type="submit" disabled={submitting} style={{ ...primaryBtn, opacity: submitting ? 0.7 : 1 }}>
                {submitting ? "Saving..." : editingId ? "Update Project" : "Create Project"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Projects List */}
      <div>
        {loading ? (
          <Spinner />
        ) : projects.length === 0 ? (
          <div style={emptyState}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth="1.5">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
            <p style={emptyTitle}>No projects yet</p>
            <p style={emptySubtitle}>Create your first project above</p>
          </div>
        ) : (
          <div style={projectsGrid}>
            {projects.map(project => (
              <div key={project.id} style={projectCard}>
                <div style={projectHeader}>
                  <div style={projectIcon}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                    </svg>
                  </div>
                  <h3 style={projectTitle}>{project.title}</h3>
                </div>
                <p style={projectDescription}>{project.description || "No description provided"}</p>
                <div style={projectMeta}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  Created {new Date(project.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric"
                  })}
                </div>
                <div style={projectActions}>
                  <button onClick={() => handleEdit(project)} style={editBtn}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    Edit
                  </button>
                  <button onClick={() => handleDelete(project.id)} style={deleteBtn}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

/* ---------- styles ---------- */

const headerContainer = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: spacing.lg,
};

const headerSection = {
  display: "flex",
  alignItems: "center",
  gap: spacing.md,
};

const headerIcon = {
  width: "48px",
  height: "48px",
  borderRadius: borderRadius.md,
  background: `linear-gradient(135deg, ${colors.accentPurple}20, ${colors.accentBlue}20)`,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: colors.accentPurple,
};

const pageTitle = {
  fontSize: "28px",
  fontWeight: 700,
  color: colors.textPrimary,
  margin: 0,
};

const pageSubtitle = {
  fontSize: "14px",
  color: colors.textMuted,
  margin: 0,
  marginTop: "4px",
};

const primaryBtn = {
  ...buttonPrimary,
};

const secondaryBtn = {
  ...buttonSecondary,
};

const formTitle = {
  display: "flex",
  alignItems: "center",
  gap: spacing.sm,
  fontSize: "18px",
  fontWeight: 600,
  color: colors.textPrimary,
  marginBottom: spacing.lg,
};

const formGroup = {
  marginBottom: spacing.md,
};

const labelStyle = {
  display: "block",
  fontSize: "13px",
  fontWeight: 500,
  color: colors.textSecondary,
  marginBottom: spacing.xs,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const requiredStar = {
  color: colors.accentRed,
};

const inputStyle = {
  ...themeInput,
  width: "100%",
  boxSizing: "border-box",
};

const formActions = {
  display: "flex",
  gap: spacing.md,
  marginTop: spacing.md,
};

const projectsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
  gap: spacing.md,
};

const projectCard = {
  ...themeCard,
  display: "flex",
  flexDirection: "column",
};

const projectHeader = {
  display: "flex",
  alignItems: "center",
  gap: spacing.sm,
  marginBottom: spacing.sm,
};

const projectIcon = {
  width: "32px",
  height: "32px",
  borderRadius: borderRadius.sm,
  background: `${colors.accentPurple}15`,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: colors.accentPurple,
};

const projectTitle = {
  fontSize: "16px",
  fontWeight: 600,
  color: colors.textPrimary,
  margin: 0,
};

const projectDescription = {
  fontSize: "14px",
  color: colors.textSecondary,
  lineHeight: 1.5,
  margin: 0,
  flex: 1,
};

const projectMeta = {
  display: "flex",
  alignItems: "center",
  gap: spacing.xs,
  fontSize: "13px",
  color: colors.textMuted,
  marginTop: spacing.md,
  paddingTop: spacing.md,
  borderTop: `1px solid ${colors.border}`,
};

const projectActions = {
  display: "flex",
  gap: spacing.sm,
  marginTop: spacing.md,
};

const editBtn = {
  display: "flex",
  alignItems: "center",
  gap: spacing.xs,
  background: `${colors.accentBlue}15`,
  color: colors.accentBlue,
  border: "none",
  padding: `${spacing.sm} ${spacing.md}`,
  borderRadius: borderRadius.sm,
  cursor: "pointer",
  fontSize: "13px",
  fontWeight: 500,
};

const deleteBtn = {
  display: "flex",
  alignItems: "center",
  gap: spacing.xs,
  background: `${colors.accentRed}15`,
  color: colors.accentRed,
  border: "none",
  padding: `${spacing.sm} ${spacing.md}`,
  borderRadius: borderRadius.sm,
  cursor: "pointer",
  fontSize: "13px",
  fontWeight: 500,
};

const emptyState = {
  ...themeCard,
  textAlign: "center",
  padding: spacing.xxl,
};

const emptyTitle = {
  fontSize: "18px",
  fontWeight: 600,
  color: colors.textSecondary,
  marginTop: spacing.md,
};

const emptySubtitle = {
  fontSize: "14px",
  color: colors.textMuted,
  marginTop: spacing.xs,
};

export default Projects;
