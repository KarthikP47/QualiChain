import { useEffect, useState } from "react";
import api from "../api";

export default function Posts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const userJson = localStorage.getItem("user");
  const user = userJson ? JSON.parse(userJson) : null;

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError("");
      setInfo("");

      // 1) Get all posts
      const res = await api.get("/posts");
      let postsList = res.data;

      // 2) If logged in, get which posts this user has upvoted
      if (user) {
        const upvotedRes = await api.get(`/users/${user.id}/upvotes`);
        const upvotedIds = new Set(upvotedRes.data.map((p) => p.post_id));

        // 3) Merge hasUpvoted flag into posts
        postsList = postsList.map((p) => ({
          ...p,
          hasUpvoted: upvotedIds.has(p.id),
        }));
      }

      setPosts(postsList);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("Failed to load posts");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpvote = async (postId) => {
    setError("");
    setInfo("");

    if (!user) {
      setError("You must be logged in to upvote.");
      return;
    }

    try {
      const res = await api.post(`/posts/${postId}/upvote`, {
        user_id: user.id,
      });

      if (res.data.ok) {
        const action =
          res.data.message === "removed" ? "Removed upvote" : "Upvoted";
        setInfo(`${action} on post ${postId}`);
        await fetchPosts();
      } else {
        setError(res.data.error || "Upvote failed");
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Error upvoting");
    }
  };

  const handleClaim = async (postId) => {
    setError("");
    setInfo("");

    if (!user) {
      setError("You must be logged in to claim rewards.");
      return;
    }

    try {
      const res = await api.post(`/posts/${postId}/claim`, {
        user_id: user.id,
      });
      if (res.data.ok) {
        setInfo(
          `Claimed ${res.data.tokens_awarded} tokens. Tx: ${res.data.txHash.substring(
            0,
            18
          )}…`
        );
      } else {
        setError(res.data.error || "Claim failed");
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Error claiming reward");
    }
  };

  if (loading) {
    return (
      <>
        <h2 className="page-title">Community feed</h2>
        <p className="page-subtitle">Loading posts…</p>
      </>
    );
  }

  return (
    <>
      <h2 className="page-title">Community feed</h2>
      <p className="page-subtitle">
        Each post has a quality score that influences how many reward tokens it
        earns.
      </p>

      {user && (
        <p className="page-subtitle" style={{ marginTop: "0.3rem" }}>
          Logged in as <strong>{user.username}</strong>.
        </p>
      )}
      {!user && (
        <p
          className="page-subtitle"
          style={{ marginTop: "0.3rem", color: "#f97373" }}
        >
          Not logged in. Login to create posts and claim rewards.
        </p>
      )}

      {info && <p className="text-success">{info}</p>}
      {error && <p className="text-error">{error}</p>}

      {posts.length === 0 && <p style={{ marginTop: "1rem" }}>No posts yet.</p>}

      <div className="posts-list">
        {posts.map((post) => (
          <div key={post.id} className="post-card">
            <div className="post-header">
              <div>
                <div className="post-title">{post.title || "(No title)"}</div>
                <div className="post-meta">
                  by {post.username} • #{post.id}
                </div>
              </div>
              <span className="badge">
                score: {post.quality_score?.toFixed
                  ? post.quality_score.toFixed(2)
                  : post.quality_score}
              </span>
            </div>

            <div className="post-body">{post.body}</div>

            <div className="post-stats">
              <span>👍 {post.upvotes} upvotes</span>
              <span>user id: {post.user_id}</span>
            </div>

            <div className="post-actions">
              <button
                className="btn"
                style={{
                  background: post.hasUpvoted ? "#6366f1" : undefined,
                }}
                onClick={() => handleUpvote(post.id)}
              >
                {post.hasUpvoted ? "Upvoted" : "Upvote"}
              </button>

              {user && user.id === post.user_id && (
                <button
                  className="btn btn-primary"
                  onClick={() => handleClaim(post.id)}
                >
                  Claim reward
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
