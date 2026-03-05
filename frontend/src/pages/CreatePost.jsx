import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function CreatePost() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("General");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const handleFileSelectBoxClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        setImageFile(file);
      } else {
        setError("Please drop an image file.");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    const userJson = localStorage.getItem("user");
    if (!userJson) {
      setError("You must be logged in to create a post.");
      return;
    }
    const user = JSON.parse(userJson);

    try {
      setIsPublishing(true);

      const formData = new FormData();
      formData.append("user_id", user.id);
      formData.append("title", title);
      formData.append("body", body);
      formData.append("category", category);

      if (imageFile) {
        formData.append("image", imageFile);
      }

      const res = await api.post("/posts", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (res.data.ok) {
        setMessage("Post created! Redirecting to feed...");
        setTimeout(() => navigate("/"), 800);
      } else {
        setError(res.data.error || "Failed to create post");
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Error creating post");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <>
      <h2 className="page-title">Create a new post</h2>
      <p className="page-subtitle">
        Longer, meaningful and unique content with genuine upvotes earns higher rewards.
      </p>

      <form className="form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="label">Title</label>
          <input
            className="input"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Eg: Why quality matters more than hype"
          />
        </div>

        <div className="form-group">
          <label className="label">Body</label>
          <textarea
            className="textarea"
            rows={6}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            placeholder="Write your content here..."
          />
        </div>

        <div className="form-group" style={{ marginBottom: "1.5rem" }}>
          <label className="label">Cover Image (Optional)</label>
          <div
            onClick={handleFileSelectBoxClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{
              border: `2px dashed ${isDragging ? 'var(--accent)' : 'var(--border-subtle)'}`,
              padding: "2.5rem 1rem",
              borderRadius: "var(--radius-md)",
              background: isDragging ? 'var(--accent-soft)' : 'var(--bg-input)',
              textAlign: "center",
              cursor: "pointer",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              position: "relative",
              overflow: "hidden",
            }}
            onMouseOver={(e) => {
              if (!isDragging) {
                e.currentTarget.style.borderColor = "var(--border-visible)";
                e.currentTarget.style.background = "var(--bg-input-focus)";
              }
            }}
            onMouseOut={(e) => {
              if (!isDragging) {
                e.currentTarget.style.borderColor = "var(--border-subtle)";
                e.currentTarget.style.background = "var(--bg-input)";
              }
            }}
          >
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setImageFile(e.target.files[0]);
                }
              }}
              style={{ display: "none" }}
            />

            {imageFile ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem", animation: "fadeIn 0.3s ease-out" }}>
                <div style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  background: "var(--gradient-button)",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 15px rgba(112, 0, 255, 0.3)",
                }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <div>
                  <p style={{ margin: "0 0 0.25rem 0", color: "var(--text)", fontWeight: "600", fontSize: "1rem" }}>
                    {imageFile.name}
                  </p>
                  <p style={{ margin: 0, color: "var(--accent)", fontSize: "0.85rem", fontWeight: "500" }}>
                    Click or drag to replace
                  </p>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem", opacity: isDragging ? 1 : 0.8 }}>
                <div style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "50%",
                  background: "var(--bg-soft)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "0.5rem",
                  border: "1px solid var(--border-subtle)",
                  boxShadow: "var(--shadow-sm)"
                }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                  </svg>
                </div>
                <div>
                  <p style={{ margin: "0 0 0.25rem 0", color: "var(--text)", fontWeight: "600", fontSize: "1rem" }}>
                    Click to upload or drag and drop
                  </p>
                  <p style={{ margin: 0, color: "var(--text-dim)", fontSize: "0.85rem" }}>
                    PNG, JPG, GIF up to 10MB
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <button className="btn btn-primary" type="submit" disabled={isPublishing}>
          {isPublishing ? "Publishing..." : "Publish"}
        </button>

        {message && <p className="text-success">{message}</p>}
        {error && <p className="text-error">{error}</p>}
      </form>
    </>
  );
}
