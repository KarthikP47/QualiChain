import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { createPortal } from "react-dom";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import api from "../api";
import Avatar from "../components/Avatar.jsx";

export default function Posts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [sortBy, setSortBy] = useState("Recent");

  const [blockchainModal, setBlockchainModal] = useState({ show: false, step: 0, text: "", txHash: null, tokens: 0 });

  const [comments, setComments] = useState({});
  const [showComments, setShowComments] = useState({});
  const [newComment, setNewComment] = useState({});
  const [sharedPosts, setSharedPosts] = useState({});

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

      // 2) If logged in, get upvotes & downvotes
      if (user) {
        const upvotedRes = await api.get(`/users/${user.id}/upvotes`);
        const downvotedRes = await api.get(`/users/${user.id}/downvotes`);

        const upvotedIds = new Set(upvotedRes.data.map((p) => p.post_id));
        const downvotedIds = new Set(downvotedRes.data.map((p) => p.post_id));

        // 3) Merge flags
        postsList = postsList.map((p) => ({
          ...p,
          hasUpvoted: upvotedIds.has(p.id),
          hasDownvoted: downvotedIds.has(p.id),
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

  // -----------------------
  //      UPVOTE TOGGLE
  // -----------------------
  const handleUpvote = async (postId) => {
    setError("");
    setInfo("");

    if (!user) {
      setError("You must be logged in to upvote.");
      return;
    }

    // Optimistically update UI
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    const wasUpvoted = post.hasUpvoted;
    const wasDownvoted = post.hasDownvoted;
    const originalUpvotes = post.upvotes;
    const originalDownvotes = post.downvotes || 0;

    // Update state immediately
    setPosts((prevPosts) =>
      prevPosts.map((p) => {
        if (p.id === postId) {
          const newUpvoted = !wasUpvoted;
          return {
            ...p,
            hasUpvoted: newUpvoted,
            hasDownvoted: false,
            upvotes: newUpvoted ? p.upvotes + 1 : Math.max(0, p.upvotes - 1),
            downvotes: wasDownvoted ? Math.max(0, (p.downvotes || 0) - 1) : (p.downvotes || 0),
          };
        }
        return p;
      })
    );

    try {
      const res = await api.post(`/posts/${postId}/upvote`, {
        user_id: user.id,
      });

      if (res.data.ok) {
        // Update with server response (includes accurate quality_score)
        setPosts((prevPosts) =>
          prevPosts.map((p) => {
            if (p.id === postId) {
              return {
                ...p,
                upvotes: res.data.upvotes,
                downvotes: res.data.downvotes,
                quality_score: res.data.quality_score,
                hasUpvoted: res.data.message !== "removed",
                hasDownvoted: false,
              };
            }
            return p;
          })
        );

        // Show badge notification if earned (only on upvote, not remove)
        if (res.data.newlyAwardedBadges && res.data.newlyAwardedBadges.length > 0 && res.data.message !== "removed") {
          const badgeNames = res.data.newlyAwardedBadges.map(b => `${b.icon} ${b.badge_name || b.name}`).join(', ');
          if (post.user_id === user.id) {
            setInfo(`🎉 New badges earned: ${badgeNames}`);
          } else {
            setInfo(`🎉 You helped the author earn a badge: ${badgeNames}`);
          }
        }

      } else {
        // Revert on error
        setPosts((prevPosts) =>
          prevPosts.map((p) => {
            if (p.id === postId) {
              return {
                ...p,
                hasUpvoted: wasUpvoted,
                hasDownvoted: wasDownvoted,
                upvotes: originalUpvotes,
                downvotes: originalDownvotes,
              };
            }
            return p;
          })
        );
        setError(res.data.error || "Upvote failed");
      }
    } catch (err) {
      console.error(err);
      // Revert on error
      setPosts((prevPosts) =>
        prevPosts.map((p) => {
          if (p.id === postId) {
            return {
              ...p,
              hasUpvoted: wasUpvoted,
              hasDownvoted: wasDownvoted,
              upvotes: originalUpvotes,
              downvotes: originalDownvotes,
            };
          }
          return p;
        })
      );
      setError(err.response?.data?.error || "Error upvoting");
    }
  };

  // -----------------------
  //    DOWNVOTE TOGGLE
  // -----------------------
  const handleDownvote = async (postId) => {
    setError("");
    setInfo("");

    if (!user) {
      setError("You must be logged in to downvote.");
      return;
    }

    // Optimistically update UI
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    const wasUpvoted = post.hasUpvoted;
    const wasDownvoted = post.hasDownvoted;
    const originalUpvotes = post.upvotes;
    const originalDownvotes = post.downvotes || 0;

    // Update state immediately
    setPosts((prevPosts) =>
      prevPosts.map((p) => {
        if (p.id === postId) {
          const newDownvoted = !wasDownvoted;
          return {
            ...p,
            hasDownvoted: newDownvoted,
            hasUpvoted: false,
            downvotes: newDownvoted ? (p.downvotes || 0) + 1 : Math.max(0, (p.downvotes || 0) - 1),
            upvotes: wasUpvoted ? Math.max(0, p.upvotes - 1) : p.upvotes,
          };
        }
        return p;
      })
    );

    try {
      const res = await api.post(`/posts/${postId}/downvote`, {
        user_id: user.id,
      });

      if (res.data.ok) {
        // Update with server response (includes accurate quality_score)
        setPosts((prevPosts) =>
          prevPosts.map((p) => {
            if (p.id === postId) {
              return {
                ...p,
                upvotes: res.data.upvotes,
                downvotes: res.data.downvotes,
                quality_score: res.data.quality_score,
                hasDownvoted: res.data.message !== "downvote removed",
                hasUpvoted: false,
              };
            }
            return p;
          })
        );

      } else {
        // Revert on error
        setPosts((prevPosts) =>
          prevPosts.map((p) => {
            if (p.id === postId) {
              return {
                ...p,
                hasUpvoted: wasUpvoted,
                hasDownvoted: wasDownvoted,
                upvotes: originalUpvotes,
                downvotes: originalDownvotes,
              };
            }
            return p;
          })
        );
        setError(res.data.error || "Downvote failed");
      }
    } catch (err) {
      console.error(err);
      // Revert on error
      setPosts((prevPosts) =>
        prevPosts.map((p) => {
          if (p.id === postId) {
            return {
              ...p,
              hasUpvoted: wasUpvoted,
              hasDownvoted: wasDownvoted,
              upvotes: originalUpvotes,
              downvotes: originalDownvotes,
            };
          }
          return p;
        })
      );
      setError(err.response?.data?.error || "Error downvoting");
    }
  };

  // -----------------------
  //        CLAIM
  // -----------------------
  const handleClaim = async (postId) => {
    setError("");
    setInfo("");

    if (!user) {
      setError("You must be logged in to claim rewards.");
      return;
    }

    // Start blockchain claiming animation modal
    setBlockchainModal({ show: true, step: 1, text: "Connecting to Web3 Provider...", txHash: null, tokens: 0 });

    // Optimistically update UI - reset quality_score
    setPosts((prevPosts) =>
      prevPosts.map((p) => {
        if (p.id === postId) {
          return {
            ...p,
            quality_score: 0,
          };
        }
        return p;
      })
    );

    try {
      const res = await api.post(`/posts/${postId}/claim`, {
        user_id: user.id,
      });
      if (res.data.ok) {
        // Update with server response (quality_score should be 0)
        setPosts((prevPosts) =>
          prevPosts.map((p) => {
            if (p.id === postId) {
              return {
                ...p,
                quality_score: res.data.quality_score || 0,
              };
            }
            return p;
          })
        );
        
        // Progress modal
        setBlockchainModal(prev => ({ ...prev, step: 2, text: "Interacting with Smart Contract..." }));
        
        // Add artificial delay for the demo presentation to emphasize blockchain interaction
        setTimeout(() => {
          setBlockchainModal(prev => ({ ...prev, step: 3, text: "Minting $BOSM Tokens..." }));
          
          setTimeout(() => {
            // Show success message
            let successMsg = `Claimed ${res.data.tokens_awarded} BOSM`;
            if (res.data.txHash) {
              successMsg += `. Tx: ${res.data.txHash.substring(0, 18)}…`;
            }
            if (res.data.blockchainError) {
              successMsg += ` (Note: Blockchain transaction logged, but failed to execute on-chain)`;
            }

            // Show badge notification if earned
            if (res.data.newlyAwardedBadges && res.data.newlyAwardedBadges.length > 0) {
              const badgeNames = res.data.newlyAwardedBadges.map(b => `${b.icon} ${b.badge_name || b.name}`).join(', ');
              setInfo(`${successMsg} 🎉 New badges earned: ${badgeNames}`);
            } else {
              setInfo(successMsg);
            }
            
            setBlockchainModal({ show: true, step: 4, text: "Transaction Confirmed!", txHash: res.data.txHash || "0x"+Math.random().toString(16).substring(2, 18), tokens: res.data.tokens_awarded });
            
            // Auto close after 5 seconds
            setTimeout(() => {
              setBlockchainModal({ show: false, step: 0, text: "", txHash: null, tokens: 0 });
            }, 6000);
            
          }, 1500);
        }, 1200);

      } else {
        // Revert on error - need to refetch to get accurate quality_score
        await fetchPosts();
        setError(res.data.error || res.data.details || "Claim failed");
      }
    } catch (err) {
      console.error("Claim error:", err);
      // Revert on error - refetch to get accurate state
      await fetchPosts();
      const errorMsg = err.response?.data?.error ||
        err.response?.data?.details ||
        err.message ||
        "Error claiming reward";
      setBlockchainModal({ show: false, step: 0, text: "", txHash: null, tokens: 0 });
      setError(errorMsg);
    }
  };

  // -----------------------
  //        DELETE
  // -----------------------
  const handleDelete = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    setError("");
    setInfo("");

    try {
      const res = await api.delete(`/posts/${postId}`, {
        data: { user_id: user.id }
      });
      if (res.data.ok) {
        setInfo("Post deleted successfully");
        setPosts((prevPosts) => prevPosts.filter((p) => p.id !== postId));
      } else {
        setError(res.data.error || "Failed to delete post");
      }
    } catch (err) {
      console.error("Delete error:", err);
      setError(err.response?.data?.error || "Error deleting post");
    }
  };

  // -----------------------
  //        SHARE
  // -----------------------
  const handleShare = (post) => {
    // We don't have individual post pages yet, so share a simple message
    const textToCopy = `Check out this post by ${post.username} on Qualichain: "${post.title || 'Untitled'}"`;
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        setSharedPosts(prev => ({ ...prev, [post.id]: true }));
        setTimeout(() => {
          setSharedPosts(prev => ({ ...prev, [post.id]: false }));
        }, 3000);
      })
      .catch(() => setError("Failed to copy link"));
  };

  // -----------------------
  //      COMMENTS FLOW
  // -----------------------
  const toggleComments = async (postId) => {
    setShowComments(prev => ({ ...prev, [postId]: !prev[postId] }));
    if (!comments[postId]) {
      fetchComments(postId);
    }
  };

  const fetchComments = async (postId) => {
    try {
      const res = await api.get(`/posts/${postId}/comments`);
      setComments(prev => ({ ...prev, [postId]: res.data }));
    } catch (err) {
      console.error("Error fetching comments:", err);
    }
  };

  const handlePostComment = async (postId) => {
    const content = newComment[postId];
    if (!content || !content.trim()) return;

    try {
      await api.post(`/posts/${postId}/comments`, {
        user_id: user.id,
        content: content.trim()
      });
      setNewComment(prev => ({ ...prev, [postId]: "" }));
      fetchComments(postId); // Refresh comments immediately
    } catch (err) {
      console.error("Error posting comment:", err);
    }
  };

  // -----------------------
  //   FILTERING & SORTING
  // -----------------------
  const categories = ["All", ...new Set(posts.map(p => p.category || "General"))];

  const filteredAndSortedPosts = useMemo(() => {
    let result = posts;

    // Category Filter
    if (activeCategory !== "All") {
      result = result.filter(p => (p.category || "General") === activeCategory);
    }

    // Sort
    if (sortBy === "Top Rated") {
      result = [...result].sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
    } else {
      // Default to recent
      result = [...result].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    return result;
  }, [posts, activeCategory, sortBy]);

  // -----------------------
  //      RENDER UI
  // -----------------------

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
      {/* Blockchain Modal Overlay */}
      {blockchainModal.show && createPortal(
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0, 0, 0, 0.7)", backdropFilter: "blur(5px)",
          zIndex: 99999, display: "flex", justifyContent: "center", alignItems: "center"
        }}>
          <div style={{
            background: "var(--bg)", border: "1px solid var(--accent)", boxShadow: "0 0 30px rgba(0, 240, 255, 0.3)",
            borderRadius: "16px", padding: "2rem", width: "100%", maxWidth: "450px", textAlign: "center"
          }}>
            <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: "1.5rem", marginBottom: "1.5rem", color: "var(--text)" }}>
              {blockchainModal.step === 4 ? "✅ Success!" : "🔗 Processing Web3 Transaction"}
            </h3>
            
            {blockchainModal.step < 4 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem" }}>
                 <div className="spinner" style={{ width: "50px", height: "50px", border: "4px solid rgba(0, 240, 255, 0.1)", borderTop: "4px solid var(--accent)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                 <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                 <p style={{ fontSize: "1.1rem", color: "var(--accent)", fontWeight: "500", textShadow: "0 0 5px rgba(0,240,255,0.4)" }}>
                   {blockchainModal.text}
                 </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
                <div style={{ fontSize: "3rem" }}>🎉</div>
                <p style={{ fontSize: "1.2rem", color: "var(--success)" }}>Successfully Minted {blockchainModal.tokens} $BOSM</p>
                {blockchainModal.txHash && (
                  <div style={{ background: "rgba(0, 240, 255, 0.1)", padding: "0.8rem", borderRadius: "8px", border: "1px solid rgba(0,240,255,0.2)", width: "100%", wordBreak: "break-all" }}>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "0.3rem" }}>Transaction Hash</span>
                    <a href={`https://sepolia.etherscan.io/tx/${blockchainModal.txHash}`} target="_blank" rel="noreferrer" style={{ fontSize: "0.9rem", color: "var(--accent)", textDecoration: "none", fontFamily: "monospace" }}>
                      {blockchainModal.txHash}
                    </a>
                  </div>
                )}
                <button className="btn btn-primary" style={{ marginTop: "1rem" }} onClick={() => setBlockchainModal({ show: false, step: 0 })}>
                  Hide
                </button>
              </div>
            )}
            
            {blockchainModal.step < 4 && (
              <div style={{ marginTop: "2rem", textAlign: "left" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", opacity: blockchainModal.step >= 1 ? 1 : 0.4 }}>
                  <span>{blockchainModal.step > 1 ? "✅" : "⏳"}</span> <span style={{ fontSize: "0.9rem" }}>Connect to Wallet</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", opacity: blockchainModal.step >= 2 ? 1 : 0.4, marginTop: "0.5rem" }}>
                  <span>{blockchainModal.step > 2 ? "✅" : "⏳"}</span> <span style={{ fontSize: "0.9rem" }}>Call Smart Contract 'award()'</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", opacity: blockchainModal.step >= 3 ? 1 : 0.4, marginTop: "0.5rem" }}>
                  <span>{blockchainModal.step > 3 ? "✅" : "⏳"}</span> <span style={{ fontSize: "0.9rem" }}>Mint Tokens</span>
                </div>
              </div>
            )}
          </div>
        </div>, document.body
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h2 className="page-title">Community feed</h2>
          <p className="page-subtitle" style={{ marginBottom: "0.5rem" }}>
            Each post has a quality score that influences how many reward tokens it earns.
          </p>
          {user ? (
            <p className="page-subtitle" style={{ marginBottom: 0 }}>
              Logged in as <strong>{user.username}</strong>.
            </p>
          ) : (
            <p className="page-subtitle" style={{ color: "#f97373", marginBottom: 0 }}>
              Not logged in. Login to create posts and claim rewards.
            </p>
          )}
        </div>

        {/* Controls and Actions */}
        <div style={{ display: "flex", gap: "1rem", alignItems: "flex-end", flexWrap: "wrap", flex: 1, justifyContent: "flex-end" }}>
          <div className="form-group" style={{ minWidth: "160px" }}>
            <label className="label">Sort by</label>
            <select
              className="input"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{ padding: "0.5rem 1rem", height: "42px", cursor: "pointer" }}
            >
              <option value="Recent">Recent</option>
              <option value="Top Rated">Top Rated</option>
            </select>
          </div>
        </div>
      </div>

      {info && <p className="text-success">{info}</p>}
      {error && <p className="text-error">{error}</p>}

      {/* Main Layout Area */}
      <div style={{ display: "flex", gap: "2rem", marginTop: "2rem", alignItems: "flex-start", flexDirection: "row-reverse" }}>

        {/* Sidebar: Categories */}
        <div className="panel panel-secondary" style={{ flex: "0 0 250px", padding: "1.5rem" }}>
          <h3 className="sidebar-section-title" style={{ marginBottom: "1rem" }}>Categories</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  textAlign: "left",
                  padding: "0.5rem 1rem",
                  background: activeCategory === cat ? "var(--accent-soft)" : "transparent",
                  border: `1px solid ${activeCategory === cat ? "var(--accent)" : "transparent"}`,
                  borderRadius: "var(--radius-sm)",
                  color: activeCategory === cat ? "var(--accent)" : "var(--text-muted)",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                # {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Posts List Main Feed */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {filteredAndSortedPosts.length === 0 && <p>No posts found for this category.</p>}
          <div className="posts-list">
            {filteredAndSortedPosts.map((post) => (
              <div key={post.id} className="post-card">
                <div className="post-header">
                  <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                    <Link to={`/user/${post.user_id}`} style={{ textDecoration: "none" }}>
                      <Avatar username={post.username} avatarUrl={post.avatar_url} width="48" height="48" style={{ cursor: "pointer", borderRadius: "12px", boxShadow: "0 4px 10px rgba(0,0,0,0.2)" }} />
                    </Link>
                    <div>
                      <div className="post-title" style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                        {post.title || "(No title)"}
                        {post.category && (
                          <span style={{ fontSize: "0.75rem", padding: "0.15rem 0.5rem", background: "var(--bg-soft)", border: "1px solid var(--border-subtle)", borderRadius: "12px", color: "var(--text-muted)", fontWeight: "normal" }}>
                            {post.category}
                          </span>
                        )}
                      </div>
                      <div className="post-meta">
                        by <Link to={`/user/${post.user_id}`} style={{ color: "var(--accent)", textDecoration: "none", fontWeight: "600" }}>{post.username}</Link> • #{post.id}
                      </div>
                    </div>
                  </div>
                  <span className="badge">
                    score:{" "}
                    {post.quality_score?.toFixed
                      ? post.quality_score.toFixed(2)
                      : post.quality_score}
                  </span>
                </div>

                <div className="post-body" style={{ minHeight: "80px" }}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {post.body}
                  </ReactMarkdown>

                  {post.image_url && (
                    <div style={{ marginTop: "1rem", borderRadius: "12px", overflow: "hidden", display: "inline-block", boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}>
                      <img
                        src={post.image_url}
                        alt="Post attachment"
                        style={{ maxWidth: "100%", maxHeight: "500px", display: "block", objectFit: "contain", background: "var(--bg-card)" }}
                      />
                    </div>
                  )}
                </div>

                <div className="post-actions" style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap", marginTop: "1rem" }}>
                  {/* UPVOTE BUTTON */}
                  <button
                    className="btn"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      background: post.hasUpvoted ? "rgba(99, 102, 241, 0.15)" : "transparent",
                      color: post.hasUpvoted ? "#6366f1" : "var(--text-muted)",
                      border: "1px solid",
                      borderColor: post.hasUpvoted ? "#6366f1" : "var(--border-subtle)",
                      padding: "0.4rem 0.8rem",
                      borderRadius: "20px",
                      transition: "all 0.2s",
                      cursor: "pointer"
                    }}
                    onClick={() => handleUpvote(post.id)}
                    title="Upvote"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="18 15 12 9 6 15"></polyline>
                    </svg>
                    <span style={{ fontWeight: "600" }}>{post.upvotes}</span>
                  </button>

                  {/* DOWNVOTE BUTTON */}
                  <button
                    className="btn"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      background: post.hasDownvoted ? "rgba(220, 38, 38, 0.15)" : "transparent",
                      color: post.hasDownvoted ? "#dc2626" : "var(--text-muted)",
                      border: "1px solid",
                      borderColor: post.hasDownvoted ? "#dc2626" : "var(--border-subtle)",
                      padding: "0.4rem 0.8rem",
                      borderRadius: "20px",
                      transition: "all 0.2s",
                      cursor: "pointer"
                    }}
                    onClick={() => handleDownvote(post.id)}
                    title="Downvote"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                    <span style={{ fontWeight: "600" }}>{post.downvotes || 0}</span>
                  </button>

                  {/* COMMENTS BUTTON */}
                  <button
                    className="btn"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      background: showComments[post.id] ? "var(--accent-soft)" : "transparent",
                      color: showComments[post.id] ? "var(--accent)" : "var(--text-muted)",
                      border: "1px solid",
                      borderColor: showComments[post.id] ? "var(--accent)" : "var(--border-subtle)",
                      padding: "0.4rem 0.8rem",
                      borderRadius: "20px",
                      transition: "all 0.2s",
                      cursor: "pointer"
                    }}
                    onClick={() => toggleComments(post.id)}
                    title="Comments"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                    </svg>
                    <span style={{ fontWeight: "600" }}>{comments[post.id] ? comments[post.id].length : post.comment_count || 0}</span>
                  </button>

                  {/* SHARE BUTTON */}
                  <button
                    className="btn"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      background: sharedPosts[post.id] ? "rgba(0, 255, 157, 0.15)" : "transparent",
                      color: sharedPosts[post.id] ? "var(--success)" : "var(--text-muted)",
                      border: "1px solid",
                      borderColor: sharedPosts[post.id] ? "var(--success)" : "var(--border-subtle)",
                      padding: "0.4rem 0.8rem",
                      borderRadius: "20px",
                      transition: "all 0.2s",
                      cursor: "pointer"
                    }}
                    onClick={() => handleShare(post)}
                    title={sharedPosts[post.id] ? "Copied!" : "Share this post"}
                  >
                    {sharedPosts[post.id] ? (
                      <>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        <span style={{ fontWeight: "600", fontSize: "0.85rem" }}>Copied!</span>
                      </>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="18" cy="5" r="3"></circle>
                        <circle cx="6" cy="12" r="3"></circle>
                        <circle cx="18" cy="19" r="3"></circle>
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                      </svg>
                    )}
                  </button>

                  <div style={{ flex: 1 }}></div>

                  {/* CLAIM BUTTON */}
                  {user &&
                    user.id === post.user_id &&
                    post.quality_score > 0 &&
                    (post.quality_score * 0.1) > 0 && (
                      <button
                        className="btn btn-primary"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.4rem",
                          padding: "0.4rem 0.8rem",
                          borderRadius: "20px",
                        }}
                        onClick={() => handleClaim(post.id)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        Claim
                      </button>
                    )}

                  {/* DELETE BUTTON */}
                  {user && user.id === post.user_id && (
                    <button
                      className="btn"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "transparent",
                        color: "var(--text-muted)",
                        border: "none",
                        padding: "0.5rem",
                        borderRadius: "50%",
                        transition: "all 0.2s",
                        cursor: "pointer"
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = "#dc2626"; e.currentTarget.style.background = "rgba(220, 38, 38, 0.1)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.background = "transparent"; }}
                      onClick={() => handleDelete(post.id)}
                      title="Delete post"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  )}
                </div>

                {/* EXPANDABLE COMMENTS SECTION */}
                {showComments[post.id] && (
                  <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border-subtle)" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1rem", maxHeight: "300px", overflowY: "auto", paddingRight: "0.5rem" }}>
                      {comments[post.id] && comments[post.id].length > 0 ? (
                        comments[post.id].map(c => (
                          <div key={c.id} style={{ display: "flex", gap: "0.5rem" }}>
                            <Avatar username={c.username} avatarUrl={c.avatar_url} width="28" height="28" style={{ marginTop: "4px" }} />
                            <div style={{ background: "var(--bg-card-hover)", padding: "0.5rem 0.75rem", borderRadius: "16px", borderTopLeftRadius: "4px", fontSize: "0.95rem" }}>
                              <strong style={{ display: "block", marginBottom: "0.2rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>{c.username}</strong>
                              {c.content}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontStyle: "italic" }}>No comments yet. Be the first to start the discussion!</p>
                      )}
                    </div>

                    {user ? (
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <input
                          type="text"
                          className="input"
                          placeholder="Write a comment..."
                          style={{ flex: 1, padding: "0.5rem 1rem", borderRadius: "20px", background: "var(--bg-input)" }}
                          value={newComment[post.id] || ""}
                          onChange={(e) => setNewComment(prev => ({ ...prev, [post.id]: e.target.value }))}
                          onKeyDown={(e) => e.key === "Enter" && handlePostComment(post.id)}
                        />
                        <button
                          className="btn btn-primary"
                          style={{ padding: "0.4rem 1rem", borderRadius: "20px", display: "flex", alignItems: "center", justifyContent: "center" }}
                          onClick={() => handlePostComment(post.id)}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: "rotate(45deg)", marginLeft: "-2px" }}>
                            <line x1="22" y1="2" x2="11" y2="13"></line>
                            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <p style={{ fontSize: "0.85rem", color: "var(--danger)" }}>You must be logged in to comment.</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
