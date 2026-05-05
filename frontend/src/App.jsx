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
  const [incentiveFilter, setIncentiveFilter] = useState("");
  const [sportFilter, setSportFilter] = useState("");
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
      if (incentiveFilter) params.append("incentive", incentiveFilter);
      if (sportFilter) params.append("sport", sportFilter);

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
  }, [incentiveFilter, sportFilter]);

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

        <select
          value={incentiveFilter}
          onChange={(e) => setIncentiveFilter(e.target.value)}
          style={{ marginRight: "12px", padding: "8px" }}
        >
          <option value="">All Incentives</option>
          <option value="1 Day PMI">1 Day PMI</option>
          <option value="2 Days PMI">2 Days PMI</option>
          <option value="50 Incentive Points">50 Incentive Points</option>
          <option value="100 Incentive Points">100 Incentive Points</option>
          <option value="Free Food">Free Food</option>
          <option value="Late Recall">Late Recall</option>
          <option value="Merch">Merch</option>
          <option value="MFE's">MFE&apos;s</option>
          <option value="Performance Pass">Performance Pass</option>
        </select>

        <select
          value={sportFilter}
          onChange={(e) => setSportFilter(e.target.value)}
          style={{ padding: "8px" }}
        >
          <option value="">All Sports</option>
          <option value="Baseball">Baseball</option>
          <option value="Football">Football</option>
          <option value="Golf">Golf</option>
          <option value="Gymnastics">Gymnastics</option>
          <option value="Hockey">Hockey</option>
          <option value="Men's Basketball">Men&apos;s Basketball</option>
          <option value="Men's Cross Country">Men&apos;s Cross Country</option>
          <option value="Men's Lacrosse">Men&apos;s Lacrosse</option>
          <option value="Men's Rugby">Men&apos;s Rugby</option>
          <option value="Men's Soccer">Men&apos;s Soccer</option>
          <option value="Men's Swim and Dive">Men&apos;s Swim and Dive</option>
          <option value="Men's Tennis">Men&apos;s Tennis</option>
          <option value="Men's Track and Field">Men&apos;s Track and Field</option>
          <option value="Rabble Rousers">Rabble Rousers</option>
          <option value="Rifle">Rifle</option>
          <option value="Softball">Softball</option>
          <option value="Sprint Football">Sprint Football</option>
          <option value="Volleyball">Volleyball</option>
          <option value="Women's Basketball">Women&apos;s Basketball</option>
          <option value="Women's Lacrosse">Women&apos;s Lacrosse</option>
          <option value="Women's Rugby">Women&apos;s Rugby</option>
          <option value="Women's Soccer">Women&apos;s Soccer</option>
          <option value="Women's Swim and Dive">Women&apos;s Swim and Dive</option>
          <option value="Women's Tennis">Women&apos;s Tennis</option>
          <option value="Women's Track and Field">Women&apos;s Track and Field</option>
          <option value="Wrestling">Wrestling</option>
        </select>
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