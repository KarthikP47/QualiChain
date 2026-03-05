import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import api from "../api";
import Avatar from "../components/Avatar.jsx";

export default function Chat() {
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomPassword, setNewRoomPassword] = useState("");
  const [searchId, setSearchId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  // Password Modal State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [modalRoomId, setModalRoomId] = useState(null);
  const [modalRoomName, setModalRoomName] = useState("");
  const [modalPasswordInput, setModalPasswordInput] = useState("");

  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);
  const userJson = localStorage.getItem("user");
  const user = userJson ? JSON.parse(userJson) : null;

  // Initialize socket connection
  useEffect(() => {
    if (!user) return;

    // Only create socket if it doesn't exist or is disconnected
    if (!socketRef.current || !socketRef.current.connected) {
      socketRef.current = io("https://true-parks-dig.loca.lt", {
        transports: ["websocket", "polling"], // Allow fallback to polling
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
        timeout: 20000,
      });

      socketRef.current.on("connect", () => {
        console.log("Connected to chat server");
        socketRef.current.emit("register", user.id);
        setError(""); // Clear any connection errors

        // Rejoin current room if we were in one
        if (currentRoom) {
          const roomIdStr = String(currentRoom.room_id_uint256);
          socketRef.current.emit("joinRoom", roomIdStr);
        }
      });

      socketRef.current.on("disconnect", (reason) => {
        console.log("Disconnected from chat server, reason:", reason);
        // Don't show error for normal disconnects or reconnection attempts
        // Socket.io will automatically try to reconnect
        // Only show error if reconnection fails (handled in reconnect_failed)
      });

      socketRef.current.on("reconnect", (attemptNumber) => {
        console.log("Reconnected to chat server after", attemptNumber, "attempts");
        setError(""); // Clear any errors on successful reconnect
        socketRef.current.emit("register", user.id);

        // Rejoin current room
        if (currentRoom) {
          const roomIdStr = String(currentRoom.room_id_uint256);
          socketRef.current.emit("joinRoom", roomIdStr);
        }
      });

      socketRef.current.on("reconnect_attempt", (attemptNumber) => {
        console.log("Reconnection attempt", attemptNumber);
      });

      socketRef.current.on("reconnect_failed", () => {
        console.error("Failed to reconnect to chat server");
        setError("Connection lost. Please refresh the page.");
      });

      socketRef.current.on("connect_error", (err) => {
        console.error("Connection error:", err);
        // Only show error if we're not already trying to reconnect
        if (!socketRef.current?.active) {
          setError("Failed to connect to chat server. Make sure backend is running.");
        }
      });

      socketRef.current.on("receiveChatMessage", (message) => {
        console.log("Received message:", message);
        setMessages((prev) => {
          // Remove temporary message if exists and add real one
          const filtered = prev.filter(m => m.id !== message.id && m.id < 1000000000000); // Remove temp messages
          return [...filtered, message];
        });
        scrollToBottom();
      });

      socketRef.current.on("chatError", (data) => {
        console.error("Chat error:", data);
        setError(data.error || "An error occurred");
      });

      socketRef.current.on("userTyping", ({ username }) => {
        setTypingUsers((prev) => {
          const nextSet = new Set(prev);
          nextSet.add(username);
          return nextSet;
        });
        scrollToBottom();
      });

      socketRef.current.on("userStoppedTyping", ({ username }) => {
        setTypingUsers((prev) => {
          const nextSet = new Set(prev);
          nextSet.delete(username);
          return nextSet;
        });
      });
    }

    return () => {
      // Only disconnect when user changes or component unmounts
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user]); // Only depend on user, not currentRoom

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch rooms on mount
  useEffect(() => {
    fetchRooms();
  }, []);

  // Join room when currentRoom changes
  useEffect(() => {
    if (currentRoom && socketRef.current) {
      if (socketRef.current.connected) {
        joinRoom(currentRoom.room_id_uint256);
      } else {
        // Wait for connection before joining
        const connectHandler = () => {
          if (currentRoom) {
            joinRoom(currentRoom.room_id_uint256);
          }
          socketRef.current?.off("connect", connectHandler);
        };
        socketRef.current.on("connect", connectHandler);
      }
    }
  }, [currentRoom]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const res = await api.get("/chat/rooms");
      setRooms(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching rooms:", err);
      setError("Failed to load chat rooms");
      setLoading(false);
    }
  };

  const createRoom = async () => {
    if (!newRoomName.trim()) {
      setError("Room name is required");
      return;
    }

    if (!user || !user.wallet_address) {
      setError("You need a wallet address to create a room");
      return;
    }

    try {
      setError("");
      setInfo("Creating room...");
      const res = await api.post("/chat/rooms", {
        name: newRoomName,
        wallet_address: user.wallet_address,
        password: newRoomPassword,
      });

      if (res.data.ok) {
        setInfo(`Room created! Room ID: ${res.data.roomId}`);
        setNewRoomName("");
        setNewRoomPassword("");
        await fetchRooms();
        // Select the new room
        const newRoom = { room_id_uint256: res.data.roomId, name: res.data.name };
        setCurrentRoom(newRoom);
      } else {
        setError(res.data.error || "Failed to create room");
      }
    } catch (err) {
      console.error("Error creating room:", err);
      setError(err.response?.data?.error || "Failed to create room");
    } finally {
      setInfo("");
    }
  };

  const joinRoom = async (roomId, password = "") => {
    if (!user) return;

    try {
      console.log("Joining room:", roomId);

      // Join on backend (blockchain)
      await api.post(`/chat/rooms/${roomId}/join`, {
        user_id: user.id,
        wallet_address: user.wallet_address || "",
        password: password,
      });

      // Join socket room - ensure roomId is a string
      if (socketRef.current && socketRef.current.connected) {
        const roomIdStr = String(roomId);
        console.log("Joining socket room:", roomIdStr);
        socketRef.current.emit("joinRoom", roomIdStr);
      } else {
        console.warn("Socket not connected, cannot join room");
        setError("Not connected to chat server");
      }

      // Fetch messages and members
      const [messagesRes, membersRes] = await Promise.all([
        api.get(`/chat/rooms/${roomId}/messages`),
        api.get(`/chat/rooms/${roomId}/members`),
      ]);

      setMessages(messagesRes.data);
      setMembers(membersRes.data);
      setError(""); // Clear any errors
    } catch (err) {
      console.error("Error joining room:", err);
      // If unauthorized, show custom password modal instead of window.prompt
      if (err.response?.status === 401 || err.response?.data?.error === 'Incorrect password') {
        const roomName = currentRoom?.name || rooms.find(r => r.room_id_uint256 === roomId)?.name || "this room";
        setModalRoomId(roomId);
        setModalRoomName(roomName);
        setModalPasswordInput("");
        setShowPasswordModal(true);
        return; // Wait for modal submission
      }

      setError("Failed to join room: " + (err.response?.data?.error || err.message));
      setCurrentRoom(null); // Clear selected room
    }
  };

  const submitPasswordModal = () => {
    if (modalRoomId) {
      joinRoom(modalRoomId, modalPasswordInput);
    }
    setShowPasswordModal(false);
  };

  const cancelPasswordModal = () => {
    setShowPasswordModal(false);
    setModalRoomId(null);
    setModalRoomName("");
    setModalPasswordInput("");
    setCurrentRoom(null);
  };

  const deleteRoom = async () => {
    if (!currentRoom || !user || !user.wallet_address) return;

    // Only creator can delete
    if (currentRoom.creator_wallet !== user.wallet_address) {
      setError("Only the room creator can delete this room");
      return;
    }

    if (!window.confirm(`Are you sure you want to permanently delete the room "${currentRoom.name}"?`)) {
      return;
    }

    try {
      setInfo("Deleting room...");
      setError("");

      await api.delete(`/chat/rooms/${currentRoom.room_id_uint256}`, {
        headers: {
          'x-wallet-address': user.wallet_address
        }
      });

      setInfo("Room deleted successfully");
      setCurrentRoom(null);
      await fetchRooms();
    } catch (err) {
      console.error("Error deleting room:", err);
      setError(err.response?.data?.error || "Failed to delete room");
    } finally {
      setTimeout(() => setInfo(""), 3000);
    }
  };

  const selectRoom = (room) => {
    setCurrentRoom(room);
    setError("");
    setInfo("");
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentRoom || !user) {
      setError("Cannot send empty message");
      return;
    }

    if (!socketRef.current || !socketRef.current.connected) {
      setError("Not connected to chat server. Please refresh the page.");
      return;
    }

    try {
      const messageData = {
        roomId: String(currentRoom.room_id_uint256), // Ensure it's a string
        userId: user.id,
        username: user.username,
        walletAddress: user.wallet_address || "",
        content: newMessage.trim(),
      };

      console.log("Sending message:", messageData);
      socketRef.current.emit("sendChatMessage", messageData);

      // Optimistically add message to UI (will be replaced by server response)
      const tempMessage = {
        id: Date.now(), // Temporary ID
        room_id_uint256: currentRoom.room_id_uint256,
        user_id: user.id,
        username: user.username,
        avatar_url: user.avatar_url,
        content: newMessage.trim(),
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, tempMessage]);
      setNewMessage("");

      // Stop typing right after sending
      socketRef.current.emit("stopTyping", {
        roomId: String(currentRoom.room_id_uint256),
        username: user.username,
      });

      scrollToBottom();
    } catch (err) {
      console.error("Error sending message:", err);
      setError("Failed to send message: " + err.message);
    }
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);

    // Emit typing indicator logic
    if (socketRef.current && currentRoom && user) {
      socketRef.current.emit("typing", {
        roomId: String(currentRoom.room_id_uint256),
        username: user.username,
      });

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current.emit("stopTyping", {
          roomId: String(currentRoom.room_id_uint256),
          username: user.username,
        });
      }, 1500); // stops typing indicators after 1.5s of no keypresses
    }
  };

  if (!user) {
    return (
      <>
        <h2 className="page-title">Chat</h2>
        <p className="page-subtitle text-error">
          You must be logged in to use chat.
        </p>
      </>
    );
  }

  return (
    <>
      {/* Search Result / Chat Main Output */}
      <h2 className="page-title">Blockchain Chat</h2>
      <p className="page-subtitle">
        Join chat rooms secured by blockchain. Create rooms and chat with the community.
      </p>

      {info && <p className="text-success">{info}</p>}
      {error && <p className="text-error">{error}</p>}

      {/* Custom Password Modal overlay */}
      {showPasswordModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          backgroundColor: "rgba(0, 0, 0, 0.6)", zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)"
        }}>
          <div style={{
            background: "var(--bg-card)", padding: "2rem", borderRadius: "12px",
            minWidth: "320px", boxShadow: "0 8px 30px rgba(0,0,0,0.3)",
            border: "1px solid var(--border-subtle)"
          }}>
            <h3 style={{ marginTop: 0, marginBottom: "0.5rem", fontSize: "1.25rem", color: "var(--text)" }}>Room Password Required</h3>
            <p style={{ margin: "0 0 1.5rem 0", color: "var(--text-muted)", fontSize: "0.95rem" }}>
              The room "{modalRoomName}" requires a password to join.
            </p>
            <input
              type="password"
              className="input"
              autoFocus
              style={{ width: "100%", marginBottom: "1.5rem", boxSizing: "border-box" }}
              placeholder="Enter password..."
              value={modalPasswordInput}
              onChange={(e) => setModalPasswordInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') submitPasswordModal(); }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
              <button className="btn btn-secondary" onClick={cancelPasswordModal} style={{ padding: "0.5rem 1rem", border: "1px solid var(--border-subtle)", background: "var(--bg-card-hover)" }}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={submitPasswordModal} style={{ padding: "0.5rem 1rem" }}>
                Join Room
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        className="chat-container"
        style={{
          display: "grid",
          gridTemplateColumns: "300px 1fr",
          gap: "1.5rem",
          minHeight: "600px",
          height: "calc(100vh - 300px)",
          maxHeight: "800px",
          alignItems: "stretch"
        }}
      >
        {/* Sidebar - Rooms List */}
        <div
          className="chat-sidebar"
          style={{
            background: "var(--bg-card)",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border-subtle)",
            padding: "1.5rem",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            height: "100%",
          }}
        >
          <h3 style={{ marginBottom: "1rem", fontSize: "1.2rem" }}>Chat Rooms</h3>

          {/* Create Room Form */}
          <div style={{
            marginBottom: "1.5rem",
            paddingBottom: "1.5rem",
            borderBottom: "1px solid var(--border-subtle)",
            flexShrink: 0
          }}>
            <input
              className="input"
              type="text"
              placeholder="New room name"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              style={{
                marginBottom: "0.5rem",
                width: "100%",
                boxSizing: "border-box"
              }}
              onKeyPress={(e) => e.key === "Enter" && createRoom()}
            />
            <input
              className="input"
              type="password"
              placeholder="Password (optional)"
              value={newRoomPassword}
              onChange={(e) => setNewRoomPassword(e.target.value)}
              style={{
                marginBottom: "0.5rem",
                width: "100%",
                boxSizing: "border-box"
              }}
              onKeyPress={(e) => e.key === "Enter" && createRoom()}
            />
            <button
              className="btn btn-primary"
              onClick={createRoom}
              style={{
                width: "100%",
                boxSizing: "border-box"
              }}
            >
              Create Room
            </button>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <input
              className="input"
              type="text"
              placeholder="Search by Room ID..."
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              style={{
                width: "100%",
                boxSizing: "border-box"
              }}
            />
          </div>

          {/* Rooms List */}
          <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
            {loading ? (
              <p style={{ color: "var(--text-muted)", textAlign: "center" }}>Loading rooms...</p>
            ) : rooms.length === 0 ? (
              <p style={{ color: "var(--text-muted)", textAlign: "center" }}>No rooms yet. Create one!</p>
            ) : (
              <div>
                {rooms.filter(r => searchId === "" || String(r.room_id_uint256).includes(searchId)).map((room) => (
                  <div
                    key={room.id}
                    onClick={() => selectRoom(room)}
                    style={{
                      padding: "0.75rem",
                      marginBottom: "0.5rem",
                      borderRadius: "var(--radius-md)",
                      background:
                        currentRoom?.room_id_uint256 === room.room_id_uint256
                          ? "var(--accent-soft)"
                          : "transparent",
                      border: `1px solid ${currentRoom?.room_id_uint256 === room.room_id_uint256
                        ? "var(--accent)"
                        : "var(--border-subtle)"
                        }`,
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      if (currentRoom?.room_id_uint256 !== room.room_id_uint256) {
                        e.currentTarget.style.background = "var(--bg-card-hover)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (currentRoom?.room_id_uint256 !== room.room_id_uint256) {
                        e.currentTarget.style.background = "transparent";
                      }
                    }}
                  >
                    <div style={{ fontWeight: "600", marginBottom: "0.25rem" }}>{room.name}</div>
                    <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                      ID: {room.room_id_uint256}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div
          style={{
            background: "var(--bg-card)",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border-subtle)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {currentRoom ? (
            <>
              {/* Chat Header */}
              <div
                style={{
                  padding: "1rem 1.5rem",
                  borderBottom: "1px solid var(--border-subtle)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexShrink: 0,
                }}
              >
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.2rem" }}>{currentRoom.name}</h3>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                    {members.length} {members.length === 1 ? "member" : "members"}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                    Room ID: {currentRoom.room_id_uint256}
                  </div>
                  {currentRoom.creator_wallet === user.wallet_address && (
                    <button
                      onClick={deleteRoom}
                      style={{
                        background: "transparent",
                        border: "1px solid var(--error-color, #ff4d4f)",
                        color: "var(--error-color, #ff4d4f)",
                        padding: "0.25rem 0.75rem",
                        borderRadius: "var(--radius-sm)",
                        fontSize: "0.85rem",
                        cursor: "pointer",
                        transition: "all 0.2s"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "var(--error-color, #ff4d4f)";
                        e.currentTarget.style.color = "white";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = "var(--error-color, #ff4d4f)";
                      }}
                    >
                      Delete Room
                    </button>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "1.5rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                  minHeight: 0,
                }}
              >
                {messages.length === 0 ? (
                  <p style={{ color: "var(--text-muted)", textAlign: "center", marginTop: "2rem" }}>
                    No messages yet. Start the conversation!
                  </p>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      style={{
                        padding: "0.75rem 1rem",
                        borderRadius: "var(--radius-md)",
                        background:
                          msg.user_id === user.id
                            ? "var(--accent-soft)"
                            : "var(--bg-soft)",
                        alignSelf: msg.user_id === user.id ? "flex-end" : "flex-start",
                        maxWidth: "70%",
                        wordWrap: "break-word",
                        overflowWrap: "break-word",
                        display: "flex",
                        flexDirection: "column"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                        <Avatar username={msg.username} avatarUrl={msg.avatar_url} width="20" height="20" />
                        <div style={{ fontSize: "0.85rem", fontWeight: "600" }}>
                          {msg.username}
                          {msg.user_id === user.id && " (You)"}
                        </div>
                      </div>
                      <div style={{ fontSize: "0.95rem" }}>{msg.content}</div>
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--text-dim)",
                          marginTop: "0.25rem",
                          alignSelf: "flex-end"
                        }}
                      >
                        {new Date(msg.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                  ))
                )}

                {/* Visual Indicator of other users typing */}
                {typingUsers.size > 0 && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "0.25rem 0.5rem",
                      color: "var(--text-muted)",
                      fontSize: "0.85rem",
                      alignSelf: "flex-start",
                    }}
                  >
                    {[...typingUsers].slice(0, 3).map((username) => (
                      <Avatar key={`typing-${username}`} username={username} width="22" height="22" />
                    ))}
                    <div style={{ marginLeft: "0.25rem" }}>
                      <span style={{ fontWeight: 600 }}>
                        {[...typingUsers].slice(0, 2).join(", ")}
                        {typingUsers.size > 2 && ` and ${typingUsers.size - 2} others`}
                      </span>{" "}
                      {typingUsers.size === 1 ? "is" : "are"} typing
                      <span className="typing-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                      </span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <form
                onSubmit={sendMessage}
                style={{
                  padding: "1rem 1.5rem",
                  borderTop: "1px solid var(--border-subtle)",
                  display: "flex",
                  gap: "0.75rem",
                  alignItems: "center",
                  flexShrink: 0,
                }}
              >
                <input
                  className="input"
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={handleInputChange}
                  style={{
                    flex: 1,
                    minWidth: 0,
                  }}
                />
                <button
                  className="btn btn-primary"
                  type="submit"
                  style={{
                    flexShrink: 0,
                  }}
                >
                  Send
                </button>
              </form>
            </>
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                color: "var(--text-muted)",
              }}
            >
              Select a room to start chatting
            </div>
          )}
        </div>
      </div>
    </>
  );
}
