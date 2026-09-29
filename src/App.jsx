import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

function App() {

  const myClasses = [
    { name: "IF3", coefficient: 3, code: "IF" },
    { name: "AU2", coefficient: 2, code: "AU" },
    { name: "TS", coefficient: 2, code: "AN" },
    { name: "TT", coefficient: 2, code: "TT" },
    { name: "TC12", coefficient: 1, code: "TC" },
    { name: "MA3-S1", coefficient: 1, code: "MA" },
    { name: "SHS3", coefficient: 2, code: "SHS" },
    { name: "Anglais", coefficient: 2, code: "ANG" }, 
    { name: "PE", coefficient: 0, code: "PE" },
    { name: "TACHES", coefficient: 0, code: "Perso" },

  ];

  const [tasks, setTasks] = useState([]);
  const [viewMode, setViewMode] = useState('grid'); // 'grid', 'list', or 'calendar'
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('gea-planner-theme') || 'light');
  const [taskError, setTaskError] = useState('');

  useEffect(() => {
    localStorage.setItem('gea-planner-theme', theme);
  }, [theme]);

  useEffect(() => {
    async function loadTasks() {
      const { data } = await supabase.from('ToDo').select('*');
      if (data) setTasks(data);
    }

    loadTasks();
  }, []);

  const addTask = async (classObj) => {
    const taskName = prompt(`Quelle est la nouvelle tâche pour ${formatClassName(classObj.name)} ?`);
    if (taskName === null || !taskName.trim()) return;
    const dueDate = prompt('Date d’échéance (JJ/MM/AAAA), ou laissez vide :');
    const normalizedDueDate = normalizeTaskDate(dueDate);
    if (dueDate?.trim() && !normalizedDueDate) {
      setTaskError('Format de date invalide. Utilisez JJ/MM/AAAA, par exemple 05/11/2026.');
      return;
    }

    setTaskError('');
    try {
      const { data, error } = await supabase
        .from('ToDo')
        .insert([{ titre: taskName.trim(), dateRendu: normalizedDueDate || "No date", class_name: classObj.name }])
        .select();

      if (error) throw error;
      if (!data?.length) {
        setTaskError('La tâche n’a pas été renvoyée par Supabase. Vérifiez les autorisations de la table et actualisez la page.');
        return;
      }

      setTasks(currentTasks => [...currentTasks, ...data]);
    } catch (error) {
      setTaskError(`Impossible d’ajouter la tâche : ${error.message || 'La requête Supabase a échoué.'}`);
    }
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
    const newTaskName = prompt('Modifier le nom de la tâche :', task.titre);
    if (newTaskName === null) return; // User cancelled

    const newDueDate = prompt('Modifier la date d’échéance (JJ/MM/AAAA) :', formatTaskDate(task.dateRendu) === 'Sans date' ? '' : formatTaskDate(task.dateRendu));
    if (newDueDate === null) return; // User cancelled
    const normalizedDueDate = normalizeTaskDate(newDueDate);
    if (newDueDate.trim() && !normalizedDueDate) {
      setTaskError('Format de date invalide. Utilisez JJ/MM/AAAA, par exemple 05/11/2026.');
      return;
    }

    const { data } = await supabase
      .from('ToDo')
      .update({ titre: newTaskName, dateRendu: normalizedDueDate || "No date" })
      .eq('id', task.id)
      .select();

    if (data && data.length > 0) {
      setTasks(tasks.map(t => t.id === task.id ? data[0] : t));
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
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return tasks.filter(t => t.dateRendu === dateStr);
  };

  const formatClassName = (name) => name === 'TACHES' ? 'Tâches' : name;

  const formatTaskDate = (value) => {
    if (value === 'No date') return 'Sans date';
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [year, month, day] = value.split('-').map(Number);
      return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
    }
    return value;
  };

  const normalizeTaskDate = (value) => {
    const trimmedValue = value?.trim();
    if (!trimmedValue) return '';

    const match = trimmedValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!match) return null;

    const [, dayText, monthText, yearText] = match;
    const day = Number(dayText);
    const month = Number(monthText);
    const year = Number(yearText);
    const parsedDate = new Date(year, month - 1, day);
    if (parsedDate.getFullYear() !== year || parsedDate.getMonth() !== month - 1 || parsedDate.getDate() !== day) return null;

    return `${yearText}-${monthText.padStart(2, '0')}-${dayText.padStart(2, '0')}`;
  };

  const isAppointmentTask = (task) => task.class_name === 'Appointements';

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return (new Date(date.getFullYear(), date.getMonth(), 1).getDay() + 6) % 7;
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
    <div data-theme={theme} style={{ display: 'flex', backgroundColor: '#fffafa', minHeight: '100vh', width: '100vw', boxSizing: 'border-box', fontFamily: 'sans-serif', position: 'relative' }}>
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
        backgroundColor: '#252729', 
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
        <h3 style={{ color: 'white', margin: '0 0 20px 0', fontSize: '1rem' }}>Affichage</h3>
        
        <button 
          onClick={() => { setViewMode('grid'); setSidebarOpen(false); }}
          style={{ 
            padding: '12px 16px', 
            borderRadius: '8px', 
            border: 'none', 
            backgroundColor: viewMode === 'grid' ? '#55595e' : '#35383b',
            color: 'white',
            cursor: 'pointer',
            fontSize: '0.95rem',
            fontWeight: viewMode === 'grid' ? 'bold' : 'normal',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = viewMode === 'grid' ? '#666b70' : '#464a4e'}
          onMouseOut={(e) => e.target.style.backgroundColor = viewMode === 'grid' ? '#55595e' : '#35383b'}
        >
          📋 Tâches par matière
        </button>
        
        <button 
          onClick={() => { setViewMode('list'); setSidebarOpen(false); }}
          style={{ 
            padding: '12px 16px', 
            borderRadius: '8px', 
            border: 'none', 
            backgroundColor: viewMode === 'list' ? '#55595e' : '#35383b',
            color: 'white',
            cursor: 'pointer',
            fontSize: '0.95rem',
            fontWeight: viewMode === 'list' ? 'bold' : 'normal',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = viewMode === 'list' ? '#666b70' : '#464a4e'}
          onMouseOut={(e) => e.target.style.backgroundColor = viewMode === 'list' ? '#55595e' : '#35383b'}
        >
          📝 Toutes les tâches
        </button>

        <button 
          onClick={() => { setViewMode('calendar'); setSidebarOpen(false); }}
          style={{ 
            padding: '12px 16px', 
            borderRadius: '8px', 
            border: 'none', 
            backgroundColor: viewMode === 'calendar' ? '#55595e' : '#35383b',
            color: 'white',
            cursor: 'pointer',
            fontSize: '0.95rem',
            fontWeight: viewMode === 'calendar' ? 'bold' : 'normal',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = viewMode === 'calendar' ? '#666b70' : '#464a4e'}
          onMouseOut={(e) => e.target.style.backgroundColor = viewMode === 'calendar' ? '#55595e' : '#35383b'}
        >
          📅 Calendrier
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
            backgroundColor: '#252729',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            fontSize: '1.5rem',
            zIndex: 1000,
            display: 'none'
          }}
          className="mobile-menu-button"
          aria-label="Ouvrir le menu"
        >
          ☰
        </button>

        <header className="app-header" style={{ textAlign: 'center', marginBottom: '40px', position: 'relative' }}>
          <h1 style={{ color: '#a71930' }}>Planning 4GEA S3</h1>
          <button
            type="button"
            className="theme-toggle"
            aria-label={`Passer en mode ${theme === 'dark' ? 'clair' : 'sombre'}`}
            aria-pressed={theme === 'dark'}
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? '☀ Mode clair' : '☾ Mode sombre'}
          </button>
        </header>

        {taskError && <div className="task-error" role="alert">{taskError}</div>}
        
        {viewMode === 'calendar' ? (
          // CALENDAR VIEW
          <div className="calendar-container" style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div className="calendar-inner" style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', padding: '30px' }}>
              {/* Month Navigation */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <button 
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                  style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#c41230', color: 'white', cursor: 'pointer' }}
                >
                  ← Précédent
                </button>
                <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#1e293b' }}>
                  {currentMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                </h2>
                <button 
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                  style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#c41230', color: 'white', cursor: 'pointer' }}
                >
                  Suivant →
                </button>
              </div>

              {/* Weekdays */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', backgroundColor: '#e2e8f0', padding: '1px', marginBottom: '10px', borderRadius: '6px', overflow: 'hidden' }}>
                {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
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

                  let bgColor = theme === 'dark' ? '#192320' : '#f8fafc';
                  if (date) {
                    if (isToday) {
                      bgColor = theme === 'dark' ? '#a53a4c' : '#c41230';
                    } else if (isHighlighted(date)) {
                      bgColor = theme === 'dark' ? '#42272c' : '#fff0f2';
                    } else if (isCurrentMonth) {
                      bgColor = theme === 'dark' ? '#202a27' : 'white';
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
                            backgroundColor: isToday ? (theme === 'dark' ? '#a53a4c' : '#c41230') : 'transparent'
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
                                    backgroundColor: appointment ? (theme === 'dark' ? '#493b20' : '#fef3c7') : (theme === 'dark' ? '#49272d' : '#fff1f2'),
                                    borderLeft: appointment ? '3px solid #d97706' : '3px solid #c41230',
                                    padding: '4px 6px',
                                    marginBottom: '4px',
                                    borderRadius: '3px',
                                    fontSize: '0.7rem',
                                    color: theme === 'dark' ? '#e7eee9' : '#1e293b',
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                  }}
                                  title={task.titre}
                                  onClick={() => editTask(task)}
                                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = appointment ? (theme === 'dark' ? '#5a4827' : '#fef08a') : (theme === 'dark' ? '#5b2d35' : '#ffe0e5')}
                                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = appointment ? (theme === 'dark' ? '#493b20' : '#fef3c7') : (theme === 'dark' ? '#49272d' : '#fff1f2')}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                    <span style={{ backgroundColor: appointment ? (theme === 'dark' ? '#6a5228' : '#fde68a') : (theme === 'dark' ? '#71333d' : '#ffdce1'), color: theme === 'dark' ? '#f8fafc' : '#741b2b', fontWeight: '700', borderRadius: '999px', padding: '2px 8px', fontSize: '0.65rem', letterSpacing: '0.03em' }}>
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
              <div key={classObj.name} style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', borderTop: '6px solid #c41230', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '20px', borderBottom: '1px solid #f1f5f9' }}>
                  <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{formatClassName(classObj.name)} <span style={{ fontSize: '0.95rem', color: '#334155', fontWeight: 'normal', fontStyle: 'italic' }}>(coeff. {classObj.coefficient})</span></h2>
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
                        <div style={{ fontSize: '0.7rem', color: '#c41230', fontWeight: 'bold' }}>{formatTaskDate(task.dateRendu)}</div>
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
                  <button onClick={() => addTask(classObj)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px dashed #c41230', color: '#a71930', cursor: 'pointer', backgroundColor: '#fff1f2' }}>
                    + Ajouter une tâche
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // LIST VIEW
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ color: '#1e293b', marginBottom: '20px' }}>Toutes les tâches, triées par date d’échéance et coefficients</h2>
            {getSortedTasks().length === 0 ? (
              <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '12px', textAlign: 'center', color: '#64748b' }}>
                Aucune tâche pour le moment. Créez-en une pour commencer !
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {getSortedTasks().map(task => {
                  const classObj = myClasses.find(c => c.name === task.class_name);
                  return (
                    <div key={task.id} style={{ backgroundColor: 'white', padding: '16px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: `4px solid #c41230` }}>
                      <div 
                        style={{ flex: 1, cursor: 'pointer', padding: '5px', borderRadius: '4px', transition: 'background-color 0.2s' }}
                        onClick={() => editTask(task)}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <div style={{ fontWeight: '600', fontSize: '1rem', color: '#1e293b' }}>{task.titre}</div>
                        <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>
                          {formatClassName(task.class_name)} {classObj && <span style={{ fontStyle: 'italic' }}>(coeff. {classObj.coefficient})</span>}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#c41230', fontWeight: 'bold', marginTop: '4px' }}>Échéance : {formatTaskDate(task.dateRendu)}</div>
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