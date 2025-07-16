import React, { useState, useMemo } from 'react';
import './App.css';

// Color palette from requirements
const COLORS = {
  primary: '#1976d2',
  secondary: '#388e3c',
  accent: '#ffb300'
};

// Dummy logo SVG as minimal inline for demo
const Logo = () => (
  <svg width="38" height="38" viewBox="0 0 38 38">
    <circle cx="19" cy="19" r="19" fill={COLORS.primary} />
    <rect x="9" y="13" width="20" height="3.5" rx="1.75" fill="#fff"/>
    <rect x="9" y="19" width="13" height="3.5" rx="1.75" fill={COLORS.accent}/>
  </svg>
);

// Helper to generate a unique id for new notes
const generateId = () => '_' + Math.random().toString(36).slice(2, 10);

// PUBLIC_INTERFACE
function App() {
  // localStorage persistence for demo - update to API as needed
  const getInitialNotes = () => {
    try {
      const local = window.localStorage.getItem('notes-v1');
      return local ? JSON.parse(local) : [];
    } catch {
      return [];
    }
  };

  // Notes State
  const [notes, setNotes] = useState(getInitialNotes());
  const [selectedId, setSelectedId] = useState(null);
  const [editingNote, setEditingNote] = useState(null);
  const [filter, setFilter] = useState('');
  const [showEditor, setShowEditor] = useState(false);

  // Save notes to localStorage
  const saveNotes = (nextNotes) => {
    setNotes(nextNotes);
    window.localStorage.setItem('notes-v1', JSON.stringify(nextNotes));
  };

  // Filtered Notes (memoized)
  const filteredNotes = useMemo(() => {
    if (!filter.trim()) return notes;
    return notes.filter(
      n =>
        n.title.toLowerCase().includes(filter.trim().toLowerCase()) ||
        n.content.toLowerCase().includes(filter.trim().toLowerCase())
    );
  }, [notes, filter]);

  // Selected Note
  const selectedNote = notes.find(n => n.id === selectedId);

  // Actions - Create, Edit, Delete, Update

  // PUBLIC_INTERFACE
  const handleCreate = () => {
    setEditingNote({
      id: generateId(),
      title: '',
      content: '',
      created: new Date().toISOString(),
      updated: new Date().toISOString()
    });
    setShowEditor(true);
  };

  // PUBLIC_INTERFACE
  const handleSelect = (note) => {
    setSelectedId(note.id);
    setEditingNote(null);
    setShowEditor(false);
  };

  // PUBLIC_INTERFACE
  const handleEdit = (note) => {
    setEditingNote({ ...note });
    setShowEditor(true);
  };

  // PUBLIC_INTERFACE
  const handleDelete = (note) => {
    if (!window.confirm('Delete this note?')) return;
    const nextNotes = notes.filter(n => n.id !== note.id);
    saveNotes(nextNotes);
    // If deleting currently viewed note, clear selection
    if (selectedId === note.id) setSelectedId(null);
  };

  // PUBLIC_INTERFACE
  const handleSave = (note) => {
    let updatedNotes;
    if (notes.some(n => n.id === note.id)) {
      // Edit
      updatedNotes = notes.map(n =>
        n.id === note.id ? { ...note, updated: new Date().toISOString() } : n
      );
    } else {
      // New
      updatedNotes = [
        {
          ...note,
          created: new Date().toISOString(),
          updated: new Date().toISOString()
        },
        ...notes
      ];
    }
    saveNotes(updatedNotes);
    setEditingNote(null);
    setShowEditor(false);
    setSelectedId(note.id);
  };

  // PUBLIC_INTERFACE
  const handleCancel = () => {
    setEditingNote(null);
    setShowEditor(false);
  };

  // PUBLIC_INTERFACE
  const handleFilterChange = (e) => setFilter(e.target.value);

  // --- UI COMPONENTS ---

  // Top Bar
  const NavBar = () => (
    <div className="navbar" style={{ background: COLORS.primary, color: 'white' }}>
      <div className="navbar-logo">
        <Logo />
        <span className="navbar-title">Notes</span>
      </div>
      <button className="navbar-add" style={{ background: COLORS.accent, color: '#fff' }} onClick={handleCreate}>+ Add Note</button>
    </div>
  );

  // Sidebar for search/filter
  const Sidebar = () => (
    <aside className="sidebar" style={{ background: '#f5f6fa', borderRight: `1px solid ${COLORS.primary}22` }}>
      <input
        className="sidebar-search"
        type="search"
        placeholder="Search notes…"
        value={filter}
        onChange={handleFilterChange}
        style={{ borderColor: COLORS.primary }}
      />
      {/* Could add additional filters here */}
    </aside>
  );

  // Notes List
  const NotesList = ({ notes }) => (
    <div className="notes-list">
      {notes.length === 0 && (
        <div className="notes-empty">No notes found.</div>
      )}
      {notes.map(note => (
        <div
          className={`note-list-item${note.id === selectedId ? ' selected' : ''}`}
          key={note.id}
          onClick={() => handleSelect(note)}
          tabIndex={0}
          style={{ borderLeft: note.id === selectedId ? `3.5px solid ${COLORS.accent}` : '3.5px solid transparent' }}
        >
          <div className="note-title">{note.title || <span style={{opacity:0.5}}>(Untitled)</span>}</div>
          <div className="note-snippet">
            {note.content.slice(0, 40)}{note.content.length > 40 ? '…' : ''}
          </div>
          <div className="note-actions">
            <button className="icon-button" style={{ color: COLORS.secondary }} onClick={e => { e.stopPropagation(); handleEdit(note); }} title="Edit">&#9998;</button>
            <button className="icon-button" style={{ color: COLORS.primary }} onClick={e => { e.stopPropagation(); handleSelect(note); }} title="View">&#128196;</button>
            <button className="icon-button" style={{ color: '#e53935' }} onClick={e => { e.stopPropagation(); handleDelete(note); }} title="Delete">&#128465;</button>
          </div>
        </div>
      ))}
    </div>
  );

  // Note Editor/Viewer Dialog
  const NoteDialog = ({ open, note, onSave, onCancel }) => {
    const [title, setTitle] = useState(note?.title || '');
    const [content, setContent] = useState(note?.content || '');

    React.useEffect(() => {
      setTitle(note?.title || '');
      setContent(note?.content || '');
    }, [note, open]);

    return (
      <div className={`modal${open ? ' open' : ''}`}>
        <div className="modal-backdrop" onClick={onCancel}/>
        <div className="modal-dialog card">
          <h2 style={{ color: COLORS.primary, marginTop:0 }}> {note && notes.some(n => n.id === note.id) ? "Edit Note" : "New Note"} </h2>
          <input
            className="input input-title"
            type="text"
            placeholder="Title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            style={{ borderColor: COLORS.primary }}
          />
          <textarea
            className="input input-content"
            rows={8}
            placeholder="Your note..."
            value={content}
            onChange={e => setContent(e.target.value)}
            style={{ borderColor: COLORS.primary }}
          />
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', flexFlow:'row-reverse'}}>
            <button
              className="button"
              style={{ background: COLORS.primary, color:'#fff' }}
              onClick={() =>
                onSave({
                  ...note,
                  title: title.trim(),
                  content: content.trim()
                })
              }
              disabled={!title.trim() && !content.trim()}
            >
              Save
            </button>
            <button className="button" style={{ background: COLORS.secondary, color:'#fff' }} onClick={onCancel}>Cancel</button>
          </div>
        </div>
      </div>
    );
  };

  // Note Viewer dialog (read-only)
  const NoteViewer = ({ open, note, onClose }) =>
    <div className={`modal${open ? ' open' : ''}`}>
        <div className="modal-backdrop" onClick={onClose}/>
        <div className="modal-dialog card" style={{maxWidth:460}}>
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
              <h2 style={{ color: COLORS.primary, margin:0}}> {note?.title || '(Untitled)'} </h2>
              <button className="icon-button" style={{color:COLORS.accent, fontSize:'20px'}} title="Edit" onClick={() => { onClose(); handleEdit(note); }}>✎</button>
            </div>
            <div style={{
              marginTop:18,
              padding: '1rem 0.5rem',
              borderTop: `1px solid ${COLORS.primary}33`,
              minHeight: '4rem', textAlign:'left'
            }}>
              <pre className="note-full-content">{note?.content}</pre>
            </div>
            <div style={{margin:'1.3rem 0 0', display:'flex', justifyContent:'flex-end', gap:'1rem'}}>
              <button className="button" style={{ background: COLORS.secondary, color:'#fff' }} onClick={onClose}>Close</button>
              <button className="button" style={{ background: '#e53935', color:'#fff' }} onClick={() => { onClose(); handleDelete(note); }}>Delete</button>
            </div>
            <div style={{marginTop:8, fontSize:12, color:'#888', textAlign:'right'}}>
              {note?.updated ? `Updated: ${new Date(note.updated).toLocaleString()}` : ''}
            </div>
        </div>
    </div>;

  // Layout
  return (
    <div style={{ minHeight: '100vh', background: '#fff', color: '#252e3e', fontFamily:'Inter,system-ui,sans-serif', display:'flex', flexDirection:'column' }}>
      <NavBar />
      <div style={{ display: 'flex', flex: 1, minHeight:'0', height:'calc(100vh - 60px)' }}>
        <Sidebar />
        <main className="main-content">
          <NotesList notes={filteredNotes} />
        </main>
      </div>
      {showEditor &&
        <NoteDialog
          open={showEditor}
          note={editingNote}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      }
      {selectedNote && !showEditor &&
        <NoteViewer open={!!selectedNote && !showEditor} note={selectedNote} onClose={() => setSelectedId(null)} />
      }
    </div>
  );
}

export default App;
