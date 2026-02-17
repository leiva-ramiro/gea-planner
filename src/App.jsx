import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

function App() {
  const myClasses = ["EC2", "Maths", "Analyse Numérique", "ETEP2", "Humanités", "IF2", "Automatique 1", "Télécommunications 1"];
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    fetchTasks();
  }, []);

  async function fetchTasks() {
    const { data } = await supabase.from('ToDo').select('*');
    if (data) setTasks(data);
  }

  const addTask = async (className) => {
    const taskName = prompt(`What is the new task for ${className}?`);
    if (!taskName) return; 
    const dueDate = prompt(`When is it due?`);
    
    const { data, error } = await supabase
      .from('ToDo')
      .insert([{ titre: taskName, dateRendu: dueDate || "No date", class_name: className }])
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

  return (
    <div style={{ padding: '40px', backgroundColor: '#f8fafc', minHeight: '100vh', width: '100vw', boxSizing: 'border-box', fontFamily: 'sans-serif' }}>
      <header style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ color: '#1e293b' }}>3GEA S2 Planner</h1>
      </header>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '25px', maxWidth: '1400px', margin: '0 auto' }}>
        {myClasses.map((className) => (
          <div key={className} style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', borderTop: '6px solid #3b82f6', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #f1f5f9' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{className}</h2>
            </div>
            
            <div style={{ padding: '20px', flexGrow: 1, minHeight: '150px' }}>
              {tasks.filter(t => t.class_name === className).map(task => (
                <div key={task.id} style={{ padding: '10px 0', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
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
              <button onClick={() => addTask(className)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px dashed #3b82f6', color: '#3b82f6', cursor: 'pointer', backgroundColor: '#eff6ff' }}>
                + Add Assignment
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default App