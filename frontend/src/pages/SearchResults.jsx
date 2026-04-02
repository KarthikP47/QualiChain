import { useEffect, useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import api from "../api";
import Avatar from "../components/Avatar.jsx";

export default function SearchResults() {
    const [searchParams] = useSearchParams();
    const query = searchParams.get("q") || "";

    const [posts, setPosts] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const currentUser = useMemo(() => {
        const json = localStorage.getItem("user");
        return json ? JSON.parse(json) : null;
    }, []);

    useEffect(() => {
        const fetchResults = async () => {
            setLoading(true);
            setError("");
            try {
                const res = await api.get(`/search?q=${encodeURIComponent(query)}`);

                let postsList = res.data.posts || [];
                const usersList = res.data.users || [];

                if (currentUser) {
                    try {
                        const upvotedRes = await api.get(`/users/${currentUser.id}/upvotes`);
                        const downvotedRes = await api.get(`/users/${currentUser.id}/downvotes`);

                        const upvotedIds = new Set(upvotedRes.data.map((p) => p.post_id));
                        const downvotedIds = new Set(downvotedRes.data.map((p) => p.post_id));

                        postsList = postsList.map((p) => ({
                            ...p,
                            hasUpvoted: upvotedIds.has(p.id),
                            hasDownvoted: downvotedIds.has(p.id),
                        }));
                    } catch (voteErr) {
                        console.error("Error fetching user votes:", voteErr);
                    }
                }

                setPosts(postsList);
                setUsers(usersList);
            } catch (err) {
                console.error(err);
                setError("Error fetching search results");
            } finally {
                setLoading(false);
            }
        };

        if (query) {
            fetchResults();
        } else {
            setPosts([]);
            setUsers([]);
            setLoading(false);
        }
    }, [query, currentUser?.id]);

    if (loading) {
        return (
            <div style={{ marginTop: "2rem" }}>
                <h2 className="page-title">Search Results</h2>
                <p className="page-subtitle">Searching for "{query}"...</p>
            </div>
        );
    }

    return (
        <div style={{ marginTop: "2rem" }}>
            <h2 className="page-title">Search Results</h2>
            <p className="page-subtitle">Showing results for <strong>"{query}"</strong></p>

            {error && <p className="text-error">{error}</p>}

            {!loading && query && posts.length === 0 && users.length === 0 && (
                <p className="sidebar-text" style={{ marginTop: "2rem" }}>No results found.</p>
            )}

            {users.length > 0 && (
                <div style={{ marginBottom: "3rem" }}>
                    <h3 className="sidebar-section-title" style={{ marginBottom: "1rem" }}>Users</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
                        {users.map(u => (
                            <div key={u.id} className="panel panel-secondary" style={{ padding: "1.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
                                <Avatar username={u.username} avatarUrl={u.avatar_url} width="48" height="48" />
                                <div>
                                    <h4 style={{ margin: "0 0 0.25rem 0" }}>{u.username}</h4>
                                    <p className="text-muted" style={{ margin: 0, fontSize: "0.85rem" }}>
                                        Joined: {new Date(u.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {posts.length > 0 && (
                <div>
                    <h3 className="sidebar-section-title" style={{ marginBottom: "1rem" }}>Posts</h3>
                    <div className="posts-list">
                        {posts.map(post => (
                            <div key={post.id} className="post-card">
                                <div className="post-header">
                                    <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                                        <Avatar username={post.username} avatarUrl={post.avatar_url} width="48" height="48" style={{ borderRadius: "12px", boxShadow: "0 4px 10px rgba(0,0,0,0.2)" }} />
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
                                                by {post.username} • #{post.id}
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
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
