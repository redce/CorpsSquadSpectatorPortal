import React, { useEffect, useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const emptyForm = {
  team: "",
  sport: "",
  date: "",
  time: "",
  at: "Home",
  opponent: "",
  location: "",
  incentive: ""
};

export default function App() {
  const [events, setEvents] = useState([]);
  const [sportFilter, setSportFilter] = useState("");
  const [teamFilter, setTeamFilter] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentRole, setCurrentRole] = useState("");
  const [loginError, setLoginError] = useState("");
  
  async function handleLogin(e) {
  e.preventDefault();
  setLoginError("");

    try {
      const res = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (!res.ok) {
        setLoginError(data.error || "Login failed");
        return;
      }

      if (data.role === "admin") {
        setIsAdmin(true);
        setCurrentRole("admin");
      } else {
        setLoginError("User is not an admin");
      }
    } catch (err) {
      setLoginError("Unable to reach backend");
    }
  }

  function handleLogout() {
    setIsAdmin(false);
    setCurrentRole("");
    setUsername("");
    setPassword("");
    setLoginError("");
  }

  async function loadEvents() {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      if (sportFilter) params.append("sport", sportFilter);
      if (teamFilter) params.append("team", teamFilter);

      const url = params.toString()
        ? `${API_BASE_URL}/events?${params.toString()}`
        : `${API_BASE_URL}/events`;

      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load events");

      const data = await res.json();
      setEvents(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEvents();
  }, [sportFilter, teamFilter]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleCreate(e) {
    e.preventDefault();

    const res = await fetch(`${API_BASE_URL}/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Role": currentRole
      },
      body: JSON.stringify(form)
    });

    if (!res.ok) {
      alert("Failed to create event");
      return;
    }

    setForm(emptyForm);
    loadEvents();
  }

  async function handleDelete(id) {
    const res = await fetch(`${API_BASE_URL}/events/${id}`, {
      method: "DELETE",
      headers: {
        "X-Role": currentRole
      }
    });

    if (!res.ok) {
      alert("Failed to delete event");
      return;
    }

    loadEvents();
  }

  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: "20px", maxWidth: "1000px", margin: "0 auto" }}>
      <h1>Corps Squad Spectator Portal</h1>

      <section style={{ marginBottom: "24px", padding: "16px", border: "1px solid #ccc" }}>
        <h2>Admin Login</h2>

        {!isAdmin ? (
          <form onSubmit={handleLogin} style={{ display: "grid", gap: "10px", maxWidth: "400px" }}>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit">Login</button>
            {loginError && <p>{loginError}</p>}
          </form>
        ) : (
          <div>
            <p>Logged in as admin.</p>
            <button onClick={handleLogout}>Logout</button>
          </div>
        )}
      </section>

      <section style={{ marginBottom: "24px", padding: "16px", border: "1px solid #ccc" }}>
        <h2>Filter Events</h2>
        <input
          type="text"
          placeholder="Filter by team"
          value={teamFilter}
          onChange={(e) => setTeamFilter(e.target.value)}
          style={{ marginRight: "12px", padding: "8px" }}
        />
        <input
          type="text"
          placeholder="Filter by sport"
          value={sportFilter}
          onChange={(e) => setSportFilter(e.target.value)}
          style={{ padding: "8px" }}
        />
      </section>

      {isAdmin && (
        <section style={{ marginBottom: "24px", padding: "16px", border: "1px solid #ccc" }}>
          <h2>Admin: Create Event</h2>
          <form onSubmit={handleCreate} style={{ display: "grid", gap: "10px" }}>
            <input name="team" placeholder="Team" value={form.team} onChange={handleChange} required />
            <input name="sport" placeholder="Sport" value={form.sport} onChange={handleChange} required />
            <input name="date" type="date" value={form.date} onChange={handleChange} required />
            <input name="time" type="time" value={form.time} onChange={handleChange} required />
            <select name="at" value={form.at} onChange={handleChange}>
              <option value="Home">Home</option>
              <option value="Away">Away</option>
              <option value="Neutral">Neutral</option>
            </select>
            <input name="opponent" placeholder="Opponent" value={form.opponent} onChange={handleChange} required />
            <input name="location" placeholder="Location" value={form.location} onChange={handleChange} required />
            <input name="incentive" placeholder="Incentive" value={form.incentive} onChange={handleChange} />
            <button type="submit">Create Event</button>
          </form>
        </section>
      )}

      <section style={{ padding: "16px", border: "1px solid #ccc" }}>
        <h2>Events</h2>
        {loading && <p>Loading events...</p>}
        {error && <p>{error}</p>}
        {!loading && !error && events.length === 0 && <p>No events found.</p>}
        {!loading && !error && events.map((event) => (
          <div key={event.id} style={{ border: "1px solid #ddd", padding: "12px", marginBottom: "12px" }}>
            <p><strong>Team:</strong> {event.team}</p>
            <p><strong>Sport:</strong> {event.sport}</p>
            <p><strong>Date:</strong> {event.date}</p>
            <p><strong>Time:</strong> {event.time}</p>
            <p><strong>At:</strong> {event.at}</p>
            <p><strong>Opponent:</strong> {event.opponent}</p>
            <p><strong>Location:</strong> {event.location}</p>
            <p><strong>Incentive:</strong> {event.incentive || "None"}</p>
            {isAdmin && <button onClick={() => handleDelete(event.id)}>Delete</button>}
          </div>
        ))}
      </section>
    </div>
  );
}