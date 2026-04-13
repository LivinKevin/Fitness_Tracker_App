import { useState, useEffect, useRef } from "react";

const API_BASE = "/api";

const CATEGORY_COLORS = {
  "Strength":    { bg: "#FFF3E0", border: "#FF9800", text: "#E65100", icon: "🏋️" },
  "Cardio":      { bg: "#E3F2FD", border: "#2196F3", text: "#0D47A1", icon: "🏃" },
  "Flexibility": { bg: "#E8F5E9", border: "#4CAF50", text: "#1B5E20", icon: "🧘" },
  "HIIT":        { bg: "#FCE4EC", border: "#E91E63", text: "#880E4F", icon: "⚡" },
};

const MUSCLE_ICONS = {
  "Chest": "💪", "Back / Legs": "🦵", "Legs": "🦵", "Shoulders": "🤸",
  "Biceps": "💪", "Legs / Cardio": "❤️‍🔥", "Full Body": "🔥", "Core / Cardio": "🎯",
};

export default function App() {
  const [activeTab, setActiveTab] = useState("exercises");
  const [exercises, setExercises] = useState([]);
  const [categories, setCategories] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [muscleFilter, setMuscleFilter] = useState("");
  const [workoutExercises, setWorkoutExercises] = useState([]);
  const [showAddedToast, setShowAddedToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [animatedCards, setAnimatedCards] = useState(new Set());
  const [expandedWorkout, setExpandedWorkout] = useState(null);
  const [workoutSessions, setWorkoutSessions] = useState([]);
  const cardRefs = useRef({});

  // Fetch data from backend on mount
  useEffect(() => {
    async function fetchData() {
      try {
        const [exRes, catRes, wkRes, usrRes] = await Promise.all([
          fetch(`${API_BASE}/exercises`),
          fetch(`${API_BASE}/categories`),
          fetch(`${API_BASE}/workouts`),
          fetch(`${API_BASE}/users`),
        ]);

        if (!exRes.ok || !catRes.ok || !wkRes.ok || !usrRes.ok) throw new Error("API returned an error");

        const [exData, catData, wkData, usrData] = await Promise.all([
          exRes.json(), catRes.json(), wkRes.json(), usrRes.json(),
        ]);

        setExercises(exData);
        setCategories(catData);
        setWorkouts(wkData);
        setUsers(usrData);
        if (usrData.length > 0) setCurrentUser(usrData[0]);
        setApiError(null);
      } catch (err) {
        console.error("Failed to fetch from API:", err);
        setApiError("Could not connect to backend. Make sure the server is running on port 5000.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Intersection observer for card animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setAnimatedCards((prev) => new Set([...prev, entry.target.dataset.id]));
          }
        });
      },
      { threshold: 0.1 }
    );
    Object.values(cardRefs.current).forEach((ref) => {
      if (ref) observer.observe(ref);
    });
    return () => observer.disconnect();
  }, [exercises, activeTab, selectedCategory, searchTerm, muscleFilter]);

  const filteredExercises = exercises.filter((ex) => {
    if (selectedCategory && ex.category_id !== selectedCategory) return false;
    if (searchTerm && !ex.exercise_name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (muscleFilter && !ex.muscle_group.toLowerCase().includes(muscleFilter.toLowerCase())) return false;
    return true;
  });

  const muscleGroups = [...new Set(exercises.map((e) => e.muscle_group))];

  const isTimedExercise = (exercise) => {
    const cat = exercise.category_name || categories.find(c => c.category_id === exercise.category_id)?.category_name;
    return cat === "Cardio" || cat === "Flexibility";
  };

  const addToWorkout = (exercise) => {
    if (!workoutExercises.find((e) => e.exercise_id === exercise.exercise_id)) {
      const timed = isTimedExercise(exercise);
      setWorkoutExercises([...workoutExercises, {
        ...exercise,
        sets: timed ? 1 : 3,
        reps: timed ? 0 : 10,
        weight: 0,
        duration: timed ? 15 : 0,
      }]);
      setShowAddedToast(exercise.exercise_name);
      setTimeout(() => setShowAddedToast(null), 2000);
    }
  };

  const removeFromWorkout = (id) => {
    setWorkoutExercises(workoutExercises.filter((e) => e.exercise_id !== id));
  };

  const updateWorkoutExercise = (id, field, value) => {
    setWorkoutExercises(
      workoutExercises.map((e) => (e.exercise_id === id ? { ...e, [field]: parseInt(value) || 0 } : e))
    );
  };

  const deleteWorkout = async (workoutId) => {
    if (!confirm("Delete this workout? This will also remove all its sessions.")) return;

    try {
      const res = await fetch(`${API_BASE}/workouts/${workoutId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");

      const refreshRes = await fetch(`${API_BASE}/workouts`);
      const refreshData = await refreshRes.json();
      setWorkouts(refreshData);
      setExpandedWorkout(null);
      setWorkoutSessions([]);

      setShowAddedToast("Workout deleted");
      setTimeout(() => setShowAddedToast(null), 2000);
    } catch (err) {
      console.error("Failed to delete workout:", err);
      setApiError("Failed to delete workout.");
    }
  };

  const toggleWorkout = async (workoutId) => {
    if (expandedWorkout === workoutId) {
      setExpandedWorkout(null);
      setWorkoutSessions([]);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/sessions/workout/${workoutId}`);
      const data = await res.json();
      setWorkoutSessions(data);
      setExpandedWorkout(workoutId);
    } catch (err) {
      console.error("Failed to load sessions:", err);
    }
  };

  const deleteSession = async (sessionId, workoutId) => {
    try {
      await fetch(`${API_BASE}/sessions/${sessionId}`, { method: "DELETE" });

      // refresh sessions for this workout
      const sessRes = await fetch(`${API_BASE}/sessions/workout/${workoutId}`);
      const sessData = await sessRes.json();
      setWorkoutSessions(sessData);

      // refresh workouts too (trigger updates duration)
      const wkRes = await fetch(`${API_BASE}/workouts`);
      const wkData = await wkRes.json();
      setWorkouts(wkData);

      setShowAddedToast("Session removed");
      setTimeout(() => setShowAddedToast(null), 2000);
    } catch (err) {
      console.error("Failed to delete session:", err);
    }
  };

  const getColor = (exercise) => {
    const catName = exercise.category_name || categories.find(c => c.category_id === exercise.category_id)?.category_name;
    return CATEGORY_COLORS[catName] || { bg: "#F5F5F5", border: "#999", text: "#555", icon: "📋" };
  };

  const [saving, setSaving] = useState(false);

  const saveWorkout = async () => {
    if (!currentUser || workoutExercises.length === 0) return;
    setSaving(true);

    try {
      // figure out the workout type from the most common category
      const types = workoutExercises.map(e => e.category_name).filter(Boolean);
      const workoutType = types.length > 0 ? types[0] : "General";
      const today = new Date().toISOString().split("T")[0];

      // calculate total duration upfront
      const totalMinutes = workoutExercises.reduce((sum, ex) => {
        if (isTimedExercise(ex)) return sum + (ex.duration || 15);
        return sum + (ex.sets * 2);
      }, 0);

      // create the workout with the duration already set
      const wkRes = await fetch(`${API_BASE}/workouts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workout_date: today,
          duration_minutes: totalMinutes,
          workout_type: workoutType,
          user_id: currentUser.user_id,
        }),
      });
      const wkData = await wkRes.json();
      const workoutId = wkData.workout_id;

      // create a session for each exercise with start/end times
      const now = new Date();
      let currentTime = new Date(now);

      for (const ex of workoutExercises) {
        const timed = isTimedExercise(ex);
        const minutes = timed ? (ex.duration || 15) : (ex.sets * 2);
        const notes = timed
          ? `${ex.duration} min`
          : `${ex.sets} sets x ${ex.reps} reps @ ${ex.weight} lb`;

        const startTime = currentTime.toTimeString().split(" ")[0];
        currentTime = new Date(currentTime.getTime() + minutes * 60000);
        const endTime = currentTime.toTimeString().split(" ")[0];

        const sessRes = await fetch(`${API_BASE}/sessions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workout_id: workoutId,
            exercise_id: ex.exercise_id,
            session_date: today,
            start_time: startTime,
            end_time: endTime,
            notes: notes,
          }),
        });
        if (!sessRes.ok) {
          const errData = await sessRes.json();
          console.error("Session save failed:", errData);
        }
      }

      // refresh workouts list from backend
      const refreshRes = await fetch(`${API_BASE}/workouts`);
      const refreshData = await refreshRes.json();
      setWorkouts(refreshData);

      // clear the builder and go to history
      setWorkoutExercises([]);
      setShowAddedToast("Workout saved!");
      setTimeout(() => setShowAddedToast(null), 2000);
      setActiveTab("history");
    } catch (err) {
      console.error("Failed to save workout:", err);
      setApiError("Failed to save workout. Check the backend.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ ...styles.app, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div style={{ textAlign: "center", fontFamily: "system-ui" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🏋️</div>
          <p style={{ color: "#888", fontSize: 16 }}>Loading Fitness Tracker...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.app}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,700&family=Outfit:wght@300;400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes toast { 0% { opacity: 0; transform: translateY(20px); } 10% { opacity: 1; transform: translateY(0); } 90% { opacity: 1; } 100% { opacity: 0; transform: translateY(-10px); } }
        .tab-btn { transition: all 0.25s ease; cursor: pointer; }
        .tab-btn:hover { transform: translateY(-1px); }
        .cat-chip { transition: all 0.2s ease; cursor: pointer; }
        .cat-chip:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .exercise-card { transition: all 0.3s ease; cursor: pointer; }
        .exercise-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,0.12); }
        .add-btn { transition: all 0.2s ease; cursor: pointer; }
        .add-btn:hover { transform: scale(1.08); }
        .remove-btn { transition: all 0.15s ease; cursor: pointer; }
        .remove-btn:hover { background: #EF5350 !important; color: white !important; }
        .workout-row { transition: all 0.3s ease; }
        .workout-row:hover { background: #FAFAFA; }
        input:focus, select:focus { outline: none; border-color: #FF6B35 !important; box-shadow: 0 0 0 3px rgba(255,107,53,0.15); }
      `}</style>

      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerGlow} />
        <div style={styles.headerContent}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={styles.logoMark}>FT</div>
            <div>
              <h1 style={styles.title}>Fitness Tracker</h1>
              <p style={styles.subtitle}>Exercise Catalog & Workout Builder</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {workoutExercises.length > 0 && (
              <div style={styles.workoutBadge} onClick={() => setActiveTab("workout")}>
                🏋️ {workoutExercises.length} in workout
              </div>
            )}
            <select
              value={currentUser?.user_id || ""}
              onChange={(e) => {
                const user = users.find(u => u.user_id === parseInt(e.target.value));
                setCurrentUser(user);
                setWorkoutExercises([]);
              }}
              style={styles.userSelect}
            >
              {users.map((u) => (
                <option key={u.user_id} value={u.user_id} style={{ color: "#1A1A2E", background: "#fff" }}>{u.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* API Error Banner */}
      {apiError && (
        <div style={styles.errorBanner}>
          ⚠️ {apiError}
        </div>
      )}

      {/* Tabs */}
      <div style={styles.tabBar}>
        {[
          { id: "exercises", label: "Exercise Catalog", icon: "📋" },
          { id: "workout", label: "My Workout", icon: "🏋️" },
          { id: "history", label: "History", icon: "📊" },
        ].map((tab) => (
          <button
            key={tab.id}
            className="tab-btn"
            onClick={() => setActiveTab(tab.id)}
            style={{ ...styles.tab, ...(activeTab === tab.id ? styles.tabActive : {}) }}
          >
            <span style={{ fontSize: 16 }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div style={styles.content}>
        {/* ── EXERCISES TAB ── */}
        {activeTab === "exercises" && (
          <div style={{ animation: "fadeIn 0.4s ease" }}>
            <div style={styles.filterBar}>
              <div style={styles.searchBox}>
                <span style={{ fontSize: 18, opacity: 0.4 }}>🔍</span>
                <input type="text" placeholder="Search exercises..." value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)} style={styles.searchInput} />
              </div>
              <select value={muscleFilter} onChange={(e) => setMuscleFilter(e.target.value)} style={styles.selectInput}>
                <option value="">All Muscle Groups</option>
                {muscleGroups.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            <div style={styles.chipRow}>
              <button className="cat-chip" onClick={() => setSelectedCategory(null)}
                style={{ ...styles.chip, background: !selectedCategory ? "#1A1A2E" : "#F5F5F5", color: !selectedCategory ? "#fff" : "#555", fontWeight: !selectedCategory ? 600 : 400 }}>
                All
              </button>
              {categories.map((cat) => {
                const c = CATEGORY_COLORS[cat.category_name] || { bg: "#F5F5F5", border: "#999", text: "#555", icon: "📋" };
                const active = selectedCategory === cat.category_id;
                return (
                  <button key={cat.category_id} className="cat-chip"
                    onClick={() => setSelectedCategory(active ? null : cat.category_id)}
                    style={{ ...styles.chip, background: active ? c.border : c.bg, color: active ? "#fff" : c.text, fontWeight: active ? 600 : 400, border: `1.5px solid ${active ? c.border : "transparent"}` }}>
                    {c.icon} {cat.category_name}
                  </button>
                );
              })}
            </div>

            <p style={styles.resultCount}>{filteredExercises.length} exercise{filteredExercises.length !== 1 ? "s" : ""} found</p>

            <div style={styles.grid}>
              {filteredExercises.map((ex, i) => {
                const color = getColor(ex);
                const catName = ex.category_name || categories.find(c => c.category_id === ex.category_id)?.category_name || "Unknown";
                const isAnimated = animatedCards.has(String(ex.exercise_id));
                return (
                  <div key={ex.exercise_id} ref={(el) => { cardRefs.current[ex.exercise_id] = el; }}
                    data-id={ex.exercise_id} className="exercise-card"
                    style={{ ...styles.card, borderTop: `3px solid ${color.border}`, opacity: isAnimated ? 1 : 0, transform: isAnimated ? "translateY(0)" : "translateY(24px)", transition: `all 0.4s ease ${i * 0.06}s` }}>
                    <div style={styles.cardTop}>
                      <span style={{ ...styles.catBadge, background: color.bg, color: color.text }}>{color.icon} {catName}</span>
                      <span style={{ fontSize: 20 }}>{MUSCLE_ICONS[ex.muscle_group] || "💪"}</span>
                    </div>
                    <h3 style={styles.cardTitle}>{ex.exercise_name}</h3>
                    <div style={styles.cardMeta}>
                      <div style={styles.metaItem}><span style={styles.metaLabel}>Muscle</span><span style={styles.metaValue}>{ex.muscle_group}</span></div>
                      <div style={styles.metaItem}><span style={styles.metaLabel}>Equipment</span><span style={styles.metaValue}>{ex.equipment_needed}</span></div>
                    </div>
                    <button className="add-btn" onClick={() => addToWorkout(ex)}
                      style={{ ...styles.addBtn, background: workoutExercises.find((w) => w.exercise_id === ex.exercise_id) ? "#E8F5E9" : color.border, color: workoutExercises.find((w) => w.exercise_id === ex.exercise_id) ? "#2E7D32" : "#fff" }}>
                      {workoutExercises.find((w) => w.exercise_id === ex.exercise_id) ? "✓ Added" : "+ Add to Workout"}
                    </button>
                  </div>
                );
              })}
            </div>

            {filteredExercises.length === 0 && (
              <div style={styles.empty}>
                <span style={{ fontSize: 48 }}>🔍</span>
                <p style={{ marginTop: 12, color: "#999", fontFamily: "DM Sans" }}>No exercises match your filters.</p>
              </div>
            )}
          </div>
        )}

        {/* ── WORKOUT TAB ── */}
        {activeTab === "workout" && (
          <div style={{ animation: "fadeIn 0.4s ease" }}>
            <div style={styles.workoutHeader}>
              <div>
                <h2 style={styles.sectionTitle}>My Workout</h2>
                <p style={styles.sectionSub}>
                  {workoutExercises.length === 0
                    ? "Add exercises from the catalog to build your workout."
                    : `${workoutExercises.length} exercise${workoutExercises.length !== 1 ? "s" : ""} · Est. ${workoutExercises.length * 8} min`}
                </p>
              </div>
              {workoutExercises.length > 0 && (
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="add-btn" onClick={() => setWorkoutExercises([])} style={styles.clearBtn}>Clear All</button>
                  <button className="add-btn" onClick={saveWorkout} disabled={saving}
                    style={{ ...styles.saveBtn }}>
                    {saving ? "Saving..." : "Save Workout"}
                  </button>
                </div>
              )}
            </div>

            {workoutExercises.length === 0 ? (
              <div style={styles.empty}>
                <span style={{ fontSize: 56 }}>🏋️</span>
                <p style={{ marginTop: 12, color: "#999", fontFamily: "DM Sans", fontSize: 15 }}>Your workout is empty. Head to the catalog to add exercises.</p>
                <button className="add-btn" onClick={() => setActiveTab("exercises")} style={{ ...styles.goBtn, marginTop: 16 }}>Browse Exercises →</button>
              </div>
            ) : (
              <div style={styles.workoutTable}>
                <div style={styles.tableHeader}>
                  <span style={{ flex: 2 }}>Exercise</span>
                  <span style={{ flex: 1, textAlign: "center" }}>Sets</span>
                  <span style={{ flex: 1, textAlign: "center" }}>Reps / Duration</span>
                  <span style={{ flex: 1, textAlign: "center" }}>Weight (lb)</span>
                  <span style={{ width: 40 }}></span>
                </div>
                {workoutExercises.map((ex, i) => {
                  const color = getColor(ex);
                  const timed = isTimedExercise(ex);
                  return (
                    <div key={ex.exercise_id} className="workout-row"
                      style={{ ...styles.tableRow, animation: `slideUp 0.3s ease ${i * 0.05}s both` }}>
                      <div style={{ flex: 2, display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 4, height: 36, borderRadius: 2, background: color.border }} />
                        <div>
                          <div style={{ fontFamily: "Outfit", fontWeight: 600, fontSize: 14, color: "#1A1A2E" }}>{ex.exercise_name}</div>
                          <div style={{ fontFamily: "DM Sans", fontSize: 12, color: "#999" }}>{ex.muscle_group}</div>
                        </div>
                      </div>
                      <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
                        {timed ? (
                          <span style={{ fontFamily: "DM Sans", fontSize: 12, color: "#ccc" }}>—</span>
                        ) : (
                          <input type="number" value={ex.sets} onChange={(e) => updateWorkoutExercise(ex.exercise_id, "sets", e.target.value)} style={styles.numInput} min="1" max="20" />
                        )}
                      </div>
                      <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", gap: 4 }}>
                        {timed ? (
                          <>
                            <input type="number" value={ex.duration} onChange={(e) => updateWorkoutExercise(ex.exercise_id, "duration", e.target.value)} style={styles.numInput} min="1" max="300" />
                            <span style={{ fontFamily: "DM Sans", fontSize: 11, color: "#999" }}>min</span>
                          </>
                        ) : (
                          <input type="number" value={ex.reps} onChange={(e) => updateWorkoutExercise(ex.exercise_id, "reps", e.target.value)} style={styles.numInput} min="1" max="100" />
                        )}
                      </div>
                      <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
                        {timed ? (
                          <span style={{ fontFamily: "DM Sans", fontSize: 12, color: "#ccc" }}>—</span>
                        ) : (
                          <input type="number" value={ex.weight} onChange={(e) => updateWorkoutExercise(ex.exercise_id, "weight", e.target.value)} style={styles.numInput} min="0" max="1000" />
                        )}
                      </div>
                      <button className="remove-btn" onClick={() => removeFromWorkout(ex.exercise_id)} style={styles.removeBtn}>✕</button>
                    </div>
                  );
                })}
                <div style={styles.totalBar}>
                  <span>Summary</span>
                  <span style={{ fontWeight: 700, fontFamily: "Outfit" }}>
                    {workoutExercises.filter(e => !isTimedExercise(e)).reduce((sum, e) => sum + e.sets * e.reps * e.weight, 0).toLocaleString()} lb volume
                    {workoutExercises.some(e => isTimedExercise(e)) && (
                      <span style={{ color: "#999", fontWeight: 400 }}>
                        {" · "}{workoutExercises.filter(e => isTimedExercise(e)).reduce((sum, e) => sum + (e.duration || 0), 0)} min cardio
                      </span>
                    )}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── HISTORY TAB ── */}
        {activeTab === "history" && (
          <div style={{ animation: "fadeIn 0.4s ease" }}>
            <h2 style={styles.sectionTitle}>Workout History</h2>
            <p style={styles.sectionSub}>{currentUser ? `${currentUser.name}'s workouts` : "Recent logged workouts"}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 20 }}>
              {workouts.filter(w => currentUser ? w.user_id === currentUser.user_id : true).length === 0 && !apiError && (
                <div style={styles.empty}><p style={{ color: "#999", fontFamily: "DM Sans" }}>No workout history yet.</p></div>
              )}
              {workouts.filter(w => currentUser ? w.user_id === currentUser.user_id : true).map((w, i) => {
                const color = CATEGORY_COLORS[w.workout_type] || { bg: "#F5F5F5", border: "#999", icon: "📋" };
                const isExpanded = expandedWorkout === w.workout_id;
                return (
                  <div key={w.workout_id} style={{ ...styles.historyCard, borderLeft: `4px solid ${color.border}`, animation: `slideUp 0.4s ease ${i * 0.08}s both` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
                      onClick={() => toggleWorkout(w.workout_id)}>
                      <div>
                        <div style={{ fontFamily: "Outfit", fontWeight: 600, fontSize: 16, color: "#1A1A2E" }}>
                          {color.icon} {w.workout_type} Workout
                          <span style={{ fontSize: 12, fontWeight: 400, color: "#AAA", marginLeft: 8 }}>{isExpanded ? "▲" : "▼"}</span>
                        </div>
                        <div style={{ fontFamily: "DM Sans", fontSize: 13, color: "#888", marginTop: 4 }}>
                          {new Date(w.workout_date + (w.workout_date.includes('T') ? '' : 'T00:00:00')).toLocaleDateString("en-US", {
                            weekday: "long", year: "numeric", month: "long", day: "numeric",
                          })}
                          {w.user_name && <span> · {w.user_name}</span>}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{ fontFamily: "Outfit", fontWeight: 700, fontSize: 22, color: color.border }}>
                          {w.duration_minutes}<span style={{ fontSize: 12, fontWeight: 400, color: "#999" }}> min</span>
                        </div>
                        <button className="remove-btn" onClick={(e) => { e.stopPropagation(); deleteWorkout(w.workout_id); }} style={styles.removeBtn}>✕</button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div style={{ marginTop: 14, borderTop: "1px solid #F0F0F0", paddingTop: 12 }}>
                        {workoutSessions.length === 0 ? (
                          <p style={{ fontFamily: "DM Sans", fontSize: 13, color: "#AAA" }}>No sessions in this workout.</p>
                        ) : (
                          workoutSessions.map((s) => (
                            <div key={s.session_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #F8F8F8" }}>
                              <div>
                                <div style={{ fontFamily: "Outfit", fontWeight: 600, fontSize: 13, color: "#1A1A2E" }}>
                                  {s.exercise_name || "General"}
                                </div>
                                <div style={{ fontFamily: "DM Sans", fontSize: 12, color: "#999" }}>
                                  {s.notes || "No notes"}
                                  {s.start_time && s.end_time && (
                                    <span> · {s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)}</span>
                                  )}
                                </div>
                              </div>
                              <button className="remove-btn" onClick={() => deleteSession(s.session_id, w.workout_id)}
                                style={{ ...styles.removeBtn, width: 26, height: 26, fontSize: 11 }}>✕</button>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Toast */}
      {showAddedToast && (
        <div style={styles.toast}>✓ <strong>{showAddedToast}</strong></div>
      )}
    </div>
  );
}

const styles = {
  app: { minHeight: "100vh", background: "#F8F7F4", fontFamily: "DM Sans, sans-serif" },
  header: { position: "relative", background: "linear-gradient(135deg, #1A1A2E 0%, #16213E 50%, #0F3460 100%)", padding: "32px 28px 28px", overflow: "hidden" },
  headerGlow: { position: "absolute", top: -60, right: -60, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,107,53,0.25) 0%, transparent 70%)" },
  headerContent: { position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center", maxWidth: 900, margin: "0 auto" },
  logoMark: { width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg, #FF6B35, #F7931E)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Outfit", fontWeight: 800, fontSize: 16, color: "#fff", letterSpacing: -0.5 },
  title: { fontFamily: "Outfit", fontSize: 24, fontWeight: 700, color: "#fff", letterSpacing: -0.5 },
  subtitle: { fontFamily: "DM Sans", fontSize: 13, color: "rgba(255,255,255,0.55)", marginTop: 2 },
  workoutBadge: { background: "rgba(255,107,53,0.2)", border: "1px solid rgba(255,107,53,0.4)", color: "#FF6B35", padding: "8px 16px", borderRadius: 20, fontFamily: "Outfit", fontWeight: 600, fontSize: 13, cursor: "pointer" },
  userSelect: { background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", color: "#fff", padding: "8px 14px", borderRadius: 10, fontFamily: "Outfit", fontWeight: 500, fontSize: 13, cursor: "pointer", outline: "none", WebkitAppearance: "none" },
  errorBanner: { background: "#FFF3E0", borderBottom: "2px solid #FF9800", padding: "12px 28px", fontFamily: "DM Sans", fontSize: 14, color: "#E65100", textAlign: "center", maxWidth: 900, margin: "0 auto" },
  tabBar: { display: "flex", gap: 6, maxWidth: 900, margin: "0 auto", padding: "16px 28px 0" },
  tab: { display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", borderRadius: 10, border: "none", background: "transparent", fontFamily: "Outfit", fontWeight: 500, fontSize: 14, color: "#888", cursor: "pointer" },
  tabActive: { background: "#1A1A2E", color: "#fff" },
  content: { maxWidth: 900, margin: "0 auto", padding: "20px 28px 40px" },
  filterBar: { display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" },
  searchBox: { flex: 1, minWidth: 200, display: "flex", alignItems: "center", gap: 10, background: "#fff", border: "1.5px solid #E8E8E8", borderRadius: 12, padding: "0 16px" },
  searchInput: { flex: 1, border: "none", outline: "none", fontFamily: "DM Sans", fontSize: 14, padding: "12px 0", background: "transparent", color: "#1A1A2E" },
  selectInput: { background: "#fff", border: "1.5px solid #E8E8E8", borderRadius: 12, padding: "12px 16px", fontFamily: "DM Sans", fontSize: 14, color: "#1A1A2E", cursor: "pointer", minWidth: 160 },
  chipRow: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 },
  chip: { padding: "8px 16px", borderRadius: 20, border: "1.5px solid transparent", fontFamily: "Outfit", fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" },
  resultCount: { fontFamily: "DM Sans", fontSize: 13, color: "#AAA", marginBottom: 16 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 },
  card: { background: "#fff", borderRadius: 14, padding: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" },
  cardTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  catBadge: { padding: "4px 10px", borderRadius: 8, fontFamily: "Outfit", fontSize: 11, fontWeight: 600 },
  cardTitle: { fontFamily: "Outfit", fontWeight: 700, fontSize: 17, color: "#1A1A2E", marginBottom: 14, lineHeight: 1.3 },
  cardMeta: { display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 },
  metaItem: { display: "flex", justifyContent: "space-between" },
  metaLabel: { fontFamily: "DM Sans", fontSize: 12, color: "#AAA" },
  metaValue: { fontFamily: "Outfit", fontSize: 13, fontWeight: 500, color: "#444" },
  addBtn: { width: "100%", padding: "10px", borderRadius: 10, border: "none", fontFamily: "Outfit", fontWeight: 600, fontSize: 13, cursor: "pointer" },
  workoutHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  sectionTitle: { fontFamily: "Outfit", fontSize: 22, fontWeight: 700, color: "#1A1A2E" },
  sectionSub: { fontFamily: "DM Sans", fontSize: 14, color: "#999", marginTop: 4 },
  clearBtn: { background: "transparent", border: "1.5px solid #E0E0E0", borderRadius: 10, padding: "8px 18px", fontFamily: "Outfit", fontWeight: 500, fontSize: 13, color: "#999", cursor: "pointer" },
  saveBtn: { background: "#FF6B35", border: "none", borderRadius: 10, padding: "8px 18px", fontFamily: "Outfit", fontWeight: 600, fontSize: 13, color: "#fff", cursor: "pointer" },
  workoutTable: { background: "#fff", borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" },
  tableHeader: { display: "flex", alignItems: "center", padding: "14px 20px", background: "#FAFAFA", fontFamily: "Outfit", fontWeight: 600, fontSize: 12, color: "#AAA", textTransform: "uppercase", letterSpacing: 0.5 },
  tableRow: { display: "flex", alignItems: "center", padding: "14px 20px", borderTop: "1px solid #F0F0F0" },
  numInput: { width: 60, textAlign: "center", border: "1.5px solid #E8E8E8", borderRadius: 8, padding: "8px 4px", fontFamily: "Outfit", fontWeight: 600, fontSize: 14, color: "#1A1A2E", background: "#FAFAFA" },
  removeBtn: { width: 32, height: 32, borderRadius: 8, border: "none", background: "#FFF0F0", color: "#EF5350", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  totalBar: { display: "flex", justifyContent: "space-between", padding: "16px 20px", borderTop: "2px solid #F0F0F0", fontFamily: "DM Sans", fontSize: 14, color: "#666" },
  empty: { textAlign: "center", padding: "60px 20px" },
  goBtn: { background: "#1A1A2E", color: "#fff", border: "none", borderRadius: 10, padding: "10px 24px", fontFamily: "Outfit", fontWeight: 600, fontSize: 14, cursor: "pointer" },
  historyCard: { background: "#fff", borderRadius: 14, padding: "20px 24px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" },
  toast: { position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", background: "#1A1A2E", color: "#fff", padding: "12px 24px", borderRadius: 12, fontFamily: "DM Sans", fontSize: 14, animation: "toast 2s ease forwards", zIndex: 100, boxShadow: "0 8px 24px rgba(0,0,0,0.2)" },
};