import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function CreatePost() {
  const [title, setTitle]       = useState("");
  const [body, setBody]         = useState("");
  const [message, setMessage]   = useState("");
  const [error, setError]       = useState("");
  const navigate = useNavigate();

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
      const res = await api.post("/posts", {
        user_id: user.id,
        title,
        body,
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

        <button className="btn btn-primary" type="submit">
          Publish
        </button>

        {message && <p className="text-success">{message}</p>}
        {error && <p className="text-error">{error}</p>}
      </form>
    </>
  );
}
