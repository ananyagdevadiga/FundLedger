import { useEffect, useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import { supabase } from "../../supabase";

function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    title: "",
    description: ""
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title.trim()) {
      alert("Please enter project title");
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
      } else {
        // Create new
        const { error } = await supabase.from("projects").insert([{
          title: form.title,
          description: form.description,
          created_by: user?.id
        }]);

        if (error) throw error;
      }

      setForm({ title: "", description: "" });
      setShowForm(false);
      setEditingId(null);
      fetchProjects();
    } catch (err) {
      console.error(err);
      alert("Failed to save project: " + err.message);
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
      fetchProjects();
    } catch (err) {
      console.error(err);
      alert("Failed to delete: " + err.message);
    }
  };

  const cancelEdit = () => {
    setForm({ title: "", description: "" });
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <AdminLayout>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 28 }}>Projects</h1>
        <button onClick={() => setShowForm(!showForm)} style={primaryBtn}>
          {showForm ? "Cancel" : "+ Add Project"}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div style={cardStyle}>
          <h3 style={{ marginBottom: 16 }}>{editingId ? "Edit Project" : "New Project"}</h3>
          <form onSubmit={handleSubmit}>
            <input
              name="title"
              placeholder="Project Title *"
              value={form.title}
              onChange={handleChange}
              style={inputStyle}
            />
            <textarea
              name="description"
              placeholder="Project Description (optional)"
              value={form.description}
              onChange={handleChange}
              rows={3}
              style={{ ...inputStyle, resize: "none", marginTop: 12 }}
            />
            <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
              <button type="submit" disabled={submitting} style={primaryBtn}>
                {submitting ? "Saving..." : editingId ? "Update Project" : "Create Project"}
              </button>
              {editingId && (
                <button type="button" onClick={cancelEdit} style={secondaryBtn}>
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Projects List */}
      <div style={{ marginTop: 24 }}>
        {loading ? (
          <p style={muted}>Loading projects...</p>
        ) : projects.length === 0 ? (
          <div style={cardStyle}>
            <p style={muted}>No projects yet. Create your first project above.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            {projects.map(project => (
              <div key={project.id} style={cardStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <h3 style={{ marginBottom: 8 }}>{project.title}</h3>
                    <p style={muted}>{project.description || "No description"}</p>
                    <small style={{ ...muted, display: "block", marginTop: 12 }}>
                      Created: {new Date(project.created_at).toLocaleDateString()}
                    </small>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                  <button onClick={() => handleEdit(project)} style={editBtn}>
                    Edit
                  </button>
                  <button onClick={() => handleDelete(project.id)} style={deleteBtn}>
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

const cardStyle = {
  background: "#111827",
  border: "1px solid #1f2933",
  borderRadius: "10px",
  padding: "20px"
};

const inputStyle = {
  width: "100%",
  padding: "12px",
  borderRadius: "8px",
  border: "1px solid #1f2933",
  background: "#0b0e14",
  color: "white",
  fontSize: 14
};

const primaryBtn = {
  background: "#4ade80",
  color: "#000",
  border: "none",
  padding: "10px 18px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: 600
};

const secondaryBtn = {
  background: "#1f2933",
  color: "white",
  border: "none",
  padding: "10px 18px",
  borderRadius: "8px",
  cursor: "pointer"
};

const editBtn = {
  background: "#60a5fa",
  color: "#000",
  border: "none",
  padding: "6px 12px",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 500
};

const deleteBtn = {
  background: "#f87171",
  color: "#000",
  border: "none",
  padding: "6px 12px",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 500
};

const muted = {
  color: "#9ca3af",
  fontSize: 14
};

export default Projects;
