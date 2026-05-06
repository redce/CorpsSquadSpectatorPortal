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

// --- MERGED INDEPENDENT COMPONENT: EventCard ---
function EventCard({ event, isAdmin, handleDelete }) {
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState("signup"); // "signup" or "cancel"
  const [showRoster, setShowRoster] = useState(false);
  const [roster, setRoster] = useState([]);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    regiment: "1",
    company: "A",
    cNumber: ""
  });
  const [apiMessage, setApiMessage] = useState({ text: "", isError: false });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setApiMessage({ text: "", isError: false });

    if (formMode === "signup") {
      try {
        const res = await fetch(`${API_BASE_URL}/events/${event.id}/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData)
        });
        const data = await res.json();
        if (!res.ok) {
          setApiMessage({ text: data.error || "Failed to sign up.", isError: true });
          return;
        }
        setApiMessage({ text: "Successfully signed up!", isError: false });
        setShowForm(false);
        setFormData({ firstName: "", lastName: "", regiment: "1", company: "A", cNumber: "" });
      } catch (err) {
        setApiMessage({ text: "Network error.", isError: true });
      }
    } else if (formMode === "cancel") {
      try {
        const res = await fetch(`${API_BASE_URL}/events/${event.id}/signup`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cNumber: formData.cNumber })
        });
        const data = await res.json();
        if (!res.ok) {
          setApiMessage({ text: data.error || "Failed to cancel registration.", isError: true });
          return;
        }
        setApiMessage({ text: "Successfully cancelled registration.", isError: false });
        setShowForm(false);
        setFormData({ firstName: "", lastName: "", regiment: "1", company: "A", cNumber: "" });
      } catch (err) {
        setApiMessage({ text: "Network error.", isError: true });
      }
    }
  };

  const toggleRoster = async () => {
    if (!showRoster) {
      try {
        const res = await fetch(`${API_BASE_URL}/events/${event.id}/roster`, {
          method: "GET",
          headers: { "X-Role": "admin" }
        });
        if (res.ok) {
          const data = await res.json();
          setRoster(data);
        } else {
          alert("Failed to load roster data.");
        }
      } catch (err) {
        console.error("Error fetching roster:", err);
      }
    }
    setShowRoster(!showRoster);
  };

  const downloadCSV = () => {
    if (roster.length === 0) {
      alert("No cadet sign-ups available to export.");
      return;
    }
    const headers = "Last Name,First Name,Regiment,Company,C-Number,Registration Time\n";
    const rows = roster.map(cadet => 
      `"${cadet.lastName}","${cadet.firstName}","${cadet.regiment}","${cadet.company}","${cadet.cNumber}","${cadet.registrationTime}"`
    ).join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${event.sport}_vs_${event.opponent}_Roster.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ border: "1px solid #ddd", padding: "12px", marginBottom: "12px", borderRadius: "4px" }}>
      <p><strong>Team:</strong> {event.team}</p>
      <p><strong>Sport:</strong> {event.sport}</p>
      <p><strong>Date:</strong> {event.date}</p>
      <p><strong>Time:</strong> {event.time}</p>
      <p><strong>At:</strong> {event.at}</p>
      <p><strong>Opponent:</strong> {event.opponent}</p>
      <p><strong>Location:</strong> {event.location}</p>
      <p><strong>Incentive:</strong> {event.incentive || "None"}</p>

      {isAdmin && (
        <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
          <button onClick={toggleRoster} style={{ backgroundColor: showRoster ? '#6c757d' : '#007bff', color: 'white', border: 'none', padding: '6px 12px', cursor: 'pointer', borderRadius: '4px' }}>
            {showRoster ? "Hide Roster" : `View Roster (${roster.length})`}
          </button>
          <button onClick={() => handleDelete(event.id)} style={{ backgroundColor: '#ff4d4d', color: 'white', border: 'none', padding: '6px 12px', cursor: 'pointer', borderRadius: '4px' }}>
            Delete
          </button>
        </div>
      )}

      {isAdmin && showRoster && (
        <div style={{ marginTop: "15px", backgroundColor: "#f9f9f9", padding: "15px", border: "1px solid #eee", borderRadius: "4px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <h4 style={{ margin: 0 }}>Attendee Roster ({roster.length} Signed Up)</h4>
            {roster.length > 0 && (
              <button onClick={downloadCSV} style={{ backgroundColor: '#28a745', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                Export to CSV (Excel)
              </button>
            )}
          </div>
          
          {roster.length === 0 ? (
            <p style={{ fontSize: "14px", color: "#666", margin: "5px 0 0 0" }}>No cadets signed up yet.</p>
          ) : (
            <div style={{ maxHeight: "300px", overflowY: "auto", border: "1px solid #ddd", borderRadius: "4px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", textAlign: "left" }}>
                <thead style={{ position: "sticky", top: 0, backgroundColor: "#eee", zIndex: 1 }}>
                  <tr>
                    <th style={{ padding: "8px", borderBottom: "2px solid #ddd" }}>Name</th>
                    <th style={{ padding: "8px", borderBottom: "2px solid #ddd" }}>Co</th>
                    <th style={{ padding: "8px", borderBottom: "2px solid #ddd" }}>Reg</th>
                    <th style={{ padding: "8px", borderBottom: "2px solid #ddd" }}>C-Number</th>
                  </tr>
                </thead>
                <tbody>
                  {roster.map((cadet, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #eee", backgroundColor: idx % 2 === 0 ? "#fff" : "#f2f2f2" }}>
                      <td style={{ padding: "8px" }}>{cadet.lastName}, {cadet.firstName}</td>
                      <td style={{ padding: "8px" }}>{cadet.company}</td>
                      <td style={{ padding: "8px" }}>{cadet.regiment}</td>
                      <td style={{ padding: "8px" }}>{cadet.cNumber}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <button onClick={() => setShowRoster(false)} style={{ marginTop: "12px", backgroundColor: "transparent", color: "#666", border: "1px solid #ccc", padding: "4px 8px", cursor: "pointer", borderRadius: "4px", fontSize: "12px" }}>
            Collapse Roster
          </button>
        </div>
      )}

      <hr style={{ margin: "15px 0" }} />

      {!isAdmin && (
        <>
          {!showForm ? (
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => { setShowForm(true); setFormMode("signup"); }}>Sign Up to Support</button>
              <button onClick={() => { setShowForm(true); setFormMode("cancel"); }} style={{ backgroundColor: "#6c757d", color: "white", border: "none", padding: "6px 12px", cursor: "pointer", borderRadius: "4px" }}>
                Cancel a Sign-Up
              </button>
            </div>
          ) : (
            <form onSubmit={handleFormSubmit} style={{ display: "grid", gap: "8px", maxWidth: "300px" }}>
              <strong>{formMode === "signup" ? "Cadet Sign-Up" : "Cancel Registration"}</strong>
              
              {formMode === "signup" && (
                <>
                  <input type="text" name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleInputChange} required />
                  <input type="text" name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleInputChange} required />
                  <div style={{ display: "flex", gap: "10px" }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: "12px", color: "#666" }}>Regiment</label>
                      <select name="regiment" value={formData.regiment} onChange={handleInputChange} style={{ width: "100%", padding: "4px" }}>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: "12px", color: "#666" }}>Company</label>
                      <select name="company" value={formData.company} onChange={handleInputChange} style={{ width: "100%", padding: "4px" }}>
                        {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'].map(letter => (
                          <option key={letter} value={letter}>{letter}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}

              <input type="text" name="cNumber" placeholder="C Number (e.g., C12345)" value={formData.cNumber} onChange={handleInputChange} required />
              
              <div style={{ display: "flex", gap: "10px", marginTop: "5px" }}>
                <button type="submit" style={{ backgroundColor: formMode === "signup" ? "green" : "#ff4d4d", color: 'white' }}>
                  {formMode === "signup" ? "Submit" : "Confirm Cancel"}
                </button>
                <button type="button" onClick={() => setShowForm(false)}>Cancel</button>
              </div>

              <span 
                onClick={() => setFormMode(formMode === "signup" ? "cancel" : "signup")} 
                style={{ fontSize: "12px", color: "#007bff", cursor: "pointer", textDecoration: "underline", marginTop: "5px" }}
              >
                {formMode === "signup" ? "Need to cancel an existing registration?" : "Switch back to Sign-Up form"}
              </span>
            </form>
          )}
          {apiMessage.text && (
            <p style={{ color: apiMessage.isError ? "red" : "green", marginTop: "10px" }}>
              {apiMessage.text}
            </p>
          )}
        </>
      )}
    </div>
  );
}

// --- MAIN APP COMPONENT ---
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
        headers: { "Content-Type": "application/json" },
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
      headers: { "X-Role": currentRole }
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
            <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
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
        <select value={incentiveFilter} onChange={(e) => setIncentiveFilter(e.target.value)} style={{ marginRight: "12px", padding: "8px" }}>
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

        <select value={sportFilter} onChange={(e) => setSportFilter(e.target.value)} style={{ padding: "8px" }}>
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
          <EventCard key={event.id} event={event} isAdmin={isAdmin} handleDelete={handleDelete} />
        ))}
      </section>
    </div>
  );
}