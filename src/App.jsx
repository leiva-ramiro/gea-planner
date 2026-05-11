import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

function App() {

  const myClasses = [
    { name: "EC2", coefficient: 4, code: "EC" },
    { name: "Maths", coefficient: 3, code: "MA" },
    { name: "Analyse Numérique", coefficient: 3.5, code: "AN" },
    { name: "ETEP2", coefficient: 3, code: "ETP" },
    { name: "Humanités", coefficient: 3, code: "HU" },
    { name: "IF2", coefficient: 2, code: "IF" },
    { name: "Automatique 1", coefficient: 2, code: "AU" },
    { name: "Télécommunications 1", coefficient: 1, code: "TC" },
    { name: "Anglais", coefficient: 2, code: "ANG" }, 
    { name: "Appointements", coefficient: 0, code: "Perso" },

  ];

  const [tasks, setTasks] = useState([]);
  const [viewMode, setViewMode] = useState('grid'); // 'grid', 'list', or 'calendar'
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  async function fetchTasks() {
    const { data } = await supabase.from('ToDo').select('*');
    if (data) setTasks(data);
  }

  const addTask = async (classObj) => {
    const taskName = prompt(`What is the new task for ${classObj.name}?`);
    if (!taskName) return; 
    const dueDate = prompt(`When is it due?`);
    
    const { data, error } = await supabase
      .from('ToDo')
      .insert([{ titre: taskName, dateRendu: dueDate || "No date", class_name: classObj.name }])
      .select();

    if (data) setTasks([...tasks, ...data]);
  };

  // --- NEW: DELETE FUNCTION ---
  const deleteTask = async (id) => {
    const { error } = await supabase
      .from('ToDo')
      .delete()
      .eq('id', id); // "Delete where the id matches the one we clicked"

    if (!error) {
      // Remove it from the screen immediately
      setTasks(tasks.filter(t => t.id !== id));
    }
  };

  // --- NEW: EDIT FUNCTION ---
  const editTask = async (task) => {
    const newTaskName = prompt(`Edit task name:`, task.titre);
    if (newTaskName === null) return; // User cancelled

    const newDueDate = prompt(`Edit due date:`, task.dateRendu);
    if (newDueDate === null) return; // User cancelled

    const { data, error } = await supabase
      .from('ToDo')
      .update({ titre: newTaskName, dateRendu: newDueDate || "No date" })
      .eq('id', task.id)
      .select();

    if (data && data.length > 0) {
      setTasks(tasks.map(t => t.id === task.id ? data[0] : t));
      setEditingTaskId(null);
    }
  };

  // --- NEW: SORT TASKS FOR LIST VIEW ---
  const getSortedTasks = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return [...tasks].sort((a, b) => {
      // Parse dates
      const dateA = a.dateRendu === "No date" ? new Date(8640000000000000) : new Date(a.dateRendu);
      const dateB = b.dateRendu === "No date" ? new Date(8640000000000000) : new Date(b.dateRendu);

      // First sort by due date (closest first)
      if (dateA !== dateB) {
        return dateA - dateB;
      }

      // If dates are equal, sort by coefficient (highest first)
      const classA = myClasses.find(c => c.name === a.class_name);
      const classB = myClasses.find(c => c.name === b.class_name);
      const coeffA = classA ? classA.coefficient : 0;
      const coeffB = classB ? classB.coefficient : 0;

      return coeffB - coeffA;
    });
  };

  // --- NEW: CALENDAR HELPER FUNCTIONS ---
  const getTasksForDate = (date) => {
    const dateStr = date.toLocaleDateString('en-CA');
    return tasks.filter(t => t.dateRendu === dateStr);
  };

  const isAppointmentTask = (task) => task.class_name === 'Appointements';

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const generateCalendarDays = () => {
    const days = [];
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);

    // Add empty cells for days before the month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i));
    }

    return days;
  };

  const isHighlighted = (date) => {
    const month = date.getMonth();
    const day = date.getDate();
    if (month === 4 && day >= 18 && day <= 22) return true;
    if (month === 5 && day >= 1 && day <= 5) return true;
    if (month === 5 && day >= 8 && day <= 12) return true;
    if (month === 5 && day >= 22 && day <= 26) return true;
    if (month === 5 && day >= 29) return true;
    if (month === 6 && day <= 3) return true;
    return false;
  };

  return (
    <div style={{ display: 'flex', backgroundColor: '#f8fafc', minHeight: '100vh', width: '100vw', boxSizing: 'border-box', fontFamily: 'sans-serif', position: 'relative' }}>
      {/* OVERLAY FOR MOBILE */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            backgroundColor: 'rgba(0,0,0,0.5)', 
            zIndex: 998,
            display: 'none'
          }}
          className="mobile-overlay"
        />
      )}

      {/* SIDEBAR */}
      <div 
        className="sidebar"
        style={{ 
        width: '200px', 
        backgroundColor: '#1e293b', 
        padding: '20px', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '15px',
        justifyContent: 'flex-start',
        position: 'fixed',
        left: '0',
        top: '0',
        height: '100vh',
        zIndex: 999,
        transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.15s ease',
        overflowY: 'auto'
      }}>
        <h3 style={{ color: 'white', margin: '0 0 20px 0', fontSize: '1rem' }}>View</h3>
        
        <button 
          onClick={() => { setViewMode('grid'); setSidebarOpen(false); }}
          style={{ 
            padding: '12px 16px', 
            borderRadius: '8px', 
            border: 'none', 
            backgroundColor: viewMode === 'grid' ? '#3b82f6' : '#334155',
            color: 'white',
            cursor: 'pointer',
            fontSize: '0.95rem',
            fontWeight: viewMode === 'grid' ? 'bold' : 'normal',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = viewMode === 'grid' ? '#2563eb' : '#475569'}
          onMouseOut={(e) => e.target.style.backgroundColor = viewMode === 'grid' ? '#3b82f6' : '#334155'}
        >
          📋 Classes Tasks 
        </button>
        
        <button 
          onClick={() => { setViewMode('list'); setSidebarOpen(false); }}
          style={{ 
            padding: '12px 16px', 
            borderRadius: '8px', 
            border: 'none', 
            backgroundColor: viewMode === 'list' ? '#3b82f6' : '#334155',
            color: 'white',
            cursor: 'pointer',
            fontSize: '0.95rem',
            fontWeight: viewMode === 'list' ? 'bold' : 'normal',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = viewMode === 'list' ? '#2563eb' : '#475569'}
          onMouseOut={(e) => e.target.style.backgroundColor = viewMode === 'list' ? '#3b82f6' : '#334155'}
        >
          📝 All Tasks List
        </button>

        <button 
          onClick={() => { setViewMode('calendar'); setSidebarOpen(false); }}
          style={{ 
            padding: '12px 16px', 
            borderRadius: '8px', 
            border: 'none', 
            backgroundColor: viewMode === 'calendar' ? '#3b82f6' : '#334155',
            color: 'white',
            cursor: 'pointer',
            fontSize: '0.95rem',
            fontWeight: viewMode === 'calendar' ? 'bold' : 'normal',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = viewMode === 'calendar' ? '#2563eb' : '#475569'}
          onMouseOut={(e) => e.target.style.backgroundColor = viewMode === 'calendar' ? '#3b82f6' : '#334155'}
        >
          📅 Calendar
        </button>
      </div>

      {/* MAIN CONTENT */}
      <div className="main-content" style={{ flex: 1, padding: '40px', overflow: 'auto', marginLeft: 0, width: '100%', boxSizing: 'border-box', paddingTop: 'max(40px, 80px)' }}>
        {/* MOBILE MENU BUTTON */}
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '50px',
            height: '50px',
            borderRadius: '8px',
            backgroundColor: '#1e293b',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            fontSize: '1.5rem',
            zIndex: 1000,
            display: 'none'
          }}
          className="mobile-menu-button"
        >
          ☰
        </button>

        <header className="app-header" style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ color: '#1e293b' }}>3GEA S2 Planner</h1>
        </header>
        
        {viewMode === 'calendar' ? (
          // CALENDAR VIEW
          <div className="calendar-container" style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div className="calendar-inner" style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', padding: '30px' }}>
              {/* Month Navigation */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <button 
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                  style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#3b82f6', color: 'white', cursor: 'pointer' }}
                >
                  ← Prev
                </button>
                <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#1e293b' }}>
                  {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h2>
                <button 
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                  style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#3b82f6', color: 'white', cursor: 'pointer' }}
                >
                  Next →
                </button>
              </div>

              {/* Weekdays */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', backgroundColor: '#e2e8f0', padding: '1px', marginBottom: '10px', borderRadius: '6px', overflow: 'hidden' }}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} style={{ backgroundColor: '#f1f5f9', padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#334155', fontSize: '0.9rem' }}>
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="calendar-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', backgroundColor: '#e2e8f0', padding: '1px', borderRadius: '6px', overflow: 'hidden', minHeight: '500px' }}>
                {generateCalendarDays().map((date, idx) => {
                  const tasksForDate = date ? getTasksForDate(date) : [];
                  const isToday = date && new Date().toDateString() === date.toDateString();
                  const isCurrentMonth = date && date.getMonth() === currentMonth.getMonth();

                  let bgColor = '#f8fafc';
                  if (date) {
                    if (isToday) {
                      bgColor = '#3b82f6';
                    } else if (isHighlighted(date)) {
                      bgColor = '#d1fae5';
                    } else if (isCurrentMonth) {
                      bgColor = 'white';
                    }
                  }

                  return (
                    <div
                      key={idx}
                      className="calendar-day"
                      style={{
                        backgroundColor: bgColor,
                        padding: '12px',
                        minHeight: '120px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-start'
                      }}
                    >
                      {date && (
                        <>
                          <div className="day-number" style={{
                            fontWeight: isToday ? 'bold' : 'normal',
                            width: isToday ? '28px' : 'auto',
                            height: isToday ? '28px' : 'auto',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '8px',
                            fontSize: isCurrentMonth ? '1rem' : '0.85rem',
                            color: isToday ? 'white' : (isCurrentMonth ? '#1e293b' : '#94a3b8'),
                            backgroundColor: isToday ? '#3b82f6' : 'transparent'
                          }}>
                            {date.getDate()}
                          </div>
                          <div style={{ flex: 1, overflow: 'auto' }}>
                            {tasksForDate.map(task => {
                              const appointment = isAppointmentTask(task);
                              return (
                                <div
                                  key={task.id}
                                  className="task-item"
                                  style={{
                                    backgroundColor: appointment ? '#fef3c7' : '#eff6ff',
                                    borderLeft: appointment ? '3px solid #f59e0b' : '3px solid #3b82f6',
                                    padding: '4px 6px',
                                    marginBottom: '4px',
                                    borderRadius: '3px',
                                    fontSize: '0.7rem',
                                    color: '#1e293b',
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                  }}
                                  title={task.titre}
                                  onClick={() => editTask(task)}
                                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = appointment ? '#fef08a' : '#dbeafe'}
                                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = appointment ? '#fef3c7' : '#eff6ff'}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                    <span style={{ backgroundColor: appointment ? '#fde68a' : '#e0f2fe', color: '#0f172a', fontWeight: '700', borderRadius: '999px', padding: '2px 8px', fontSize: '0.65rem', letterSpacing: '0.03em' }}>
                                      {myClasses.find(c => c.name === task.class_name)?.code || ''}
                                    </span>
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                                      {task.titre}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          // GRID VIEW
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '25px', maxWidth: '1400px', margin: '0 auto' }}>
            {myClasses.map((classObj) => (
              <div key={classObj.name} style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', borderTop: '6px solid #3b82f6', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '20px', borderBottom: '1px solid #f1f5f9' }}>
                  <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{classObj.name} <span style={{ fontSize: '0.95rem', color: '#334155', fontWeight: 'normal', fontStyle: 'italic' }}>(coeff. {classObj.coefficient})</span></h2>
                </div>
                
                <div style={{ padding: '20px', flexGrow: 1, minHeight: '150px' }}>
                  {tasks.filter(t => t.class_name === classObj.name).map(task => (
                    <div key={task.id} style={{ padding: '10px 0', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div 
                        onClick={() => editTask(task)}
                        style={{ fontWeight: '500', flex: 1, cursor: 'pointer', padding: '5px', borderRadius: '4px', transition: 'background-color 0.2s' }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <div style={{ fontWeight: '500' }}>{task.titre}</div>
                        <div style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: 'bold' }}>{task.dateRendu}</div>
                      </div>
                      
                      {/* DELETE BUTTON */}
                      <button 
                        onClick={() => deleteTask(task.id)}
                        style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', fontSize: '1.2rem', padding: '5px' }}
                        onMouseOver={(e) => e.target.style.color = '#ef4444'}
                        onMouseOut={(e) => e.target.style.color = '#cbd5e1'}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>

                <div style={{ padding: '20px' }}>
                  <button onClick={() => addTask(classObj)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px dashed #3b82f6', color: '#3b82f6', cursor: 'pointer', backgroundColor: '#eff6ff' }}>
                    + Add Assignment
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // LIST VIEW
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ color: '#1e293b', marginBottom: '20px' }}>All Tasks - Sorted by Due Date</h2>
            {getSortedTasks().length === 0 ? (
              <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '12px', textAlign: 'center', color: '#64748b' }}>
                No tasks yet. Create one to get started!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {getSortedTasks().map(task => {
                  const classObj = myClasses.find(c => c.name === task.class_name);
                  return (
                    <div key={task.id} style={{ backgroundColor: 'white', padding: '16px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: `4px solid #3b82f6` }}>
                      <div 
                        style={{ flex: 1, cursor: 'pointer', padding: '5px', borderRadius: '4px', transition: 'background-color 0.2s' }}
                        onClick={() => editTask(task)}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <div style={{ fontWeight: '600', fontSize: '1rem', color: '#1e293b' }}>{task.titre}</div>
                        <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>
                          {task.class_name} {classObj && <span style={{ fontStyle: 'italic' }}>(coeff. {classObj.coefficient})</span>}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#ef4444', fontWeight: 'bold', marginTop: '4px' }}>Due: {task.dateRendu}</div>
                      </div>
                      
                      {/* DELETE BUTTON */}
                      <button 
                        onClick={() => deleteTask(task.id)}
                        style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', fontSize: '1.5rem', padding: '5px', marginLeft: '15px' }}
                        onMouseOver={(e) => e.target.style.color = '#ef4444'}
                        onMouseOut={(e) => e.target.style.color = '#cbd5e1'}
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MOBILE RESPONSIVE STYLES */}
      <style>{`
        .calendar-container {
          max-width: 1000px;
          margin: 0 auto;
        }

        .calendar-inner {
          padding: 30px;
        }

        .calendar-grid {
          min-height: 500px;
        }

        .calendar-day {
          min-height: 120px;
          padding: 12px;
        }

        .day-number {
          font-size: 1rem;
        }

        .task-item {
          font-size: 0.7rem;
        }

        .app-header {
          margin-bottom: 40px;
        }

        .main-content {
          padding: 40px;
          padding-top: max(40px, 80px);
        }

        @media (max-width: 768px) {
          .mobile-menu-button {
            display: block !important;
          }

          .mobile-overlay {
            display: block !important;
          }

          .sidebar {
            position: fixed !important;
            left: -200px !important;
            justify-content: center !important;
            padding-bottom: 100px !important;
          }

          .sidebar[style*="left: 0"] {
            left: 0 !important;
          }

          .calendar-container {
            max-width: 100%;
          }

          .calendar-inner {
            padding: 15px;
          }

          .calendar-grid {
            min-height: auto;
          }

          .calendar-day {
            min-height: 60px;
            padding: 8px;
          }

          .day-number {
            font-size: 0.8rem;
          }

          .task-item {
            font-size: 0.6rem;
          }

          .app-header {
            margin-bottom: 20px;
          }

          .app-header h1 {
            font-size: 1.5rem;
          }

          .main-content {
            padding: 20px !important;
            padding-top: 60px !important;
          }
        }

        @media (min-width: 769px) {
          .mobile-menu-button {
            display: none !important;
          }

          .mobile-overlay {
            display: none !important;
          }

          .sidebar {
            position: static !important;
            left: auto !important;
            top: auto !important;
            height: auto !important;
            transition: none !important;
            transform: none !important;
            justify-content: flex-start !important;
            padding-bottom: auto !important;
          }
        }
      `}</style>
    </div>
  )
}

export default App