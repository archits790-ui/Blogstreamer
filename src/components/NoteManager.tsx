import React, { useState } from 'react';
import { Icon, icons } from './Icons';
import type { Note } from '../types';

interface NoteManagerProps {
  data: Note[];
  onUpdate: (data: Note[]) => void;
  notify: (msg: string, type?: 'info' | 'error') => void;
  askConfirm: (msg: string, onConfirm: () => void) => void;
  filter: string;
  isDark: boolean;
}

interface DraggableCardProps {
  id: string | number;
  index: number;
  moveItem: (from: number, to: number) => void;
  children: React.ReactNode;
  disabled: boolean;
}

const DraggableCard: React.FC<DraggableCardProps> = ({ index, moveItem, children, disabled }) => {
  if (disabled) return <>{children}</>;

  const dragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
    const target = e.target as HTMLElement;
    target.classList.add('dragging');
  };

  const dragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    target.classList.remove('dragging');
  };

  const dragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const drop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const fromIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
    const toIndex = index;
    if (fromIndex !== toIndex && !isNaN(fromIndex)) {
      moveItem(fromIndex, toIndex);
    }
  };

  return (
    <div 
      draggable="true" 
      onDragStart={dragStart} 
      onDragOver={dragOver} 
      onDrop={drop} 
      onDragEnd={dragEnd}
      className="relative group transition-transform duration-200 h-full flex"
    >
      {children}
    </div>
  );
};

// Markdown Lightweight Renderer
const renderMarkdown = (text: string) => {
  if (!text) return null;
  const lines = text.split('\n');
  return lines.map((line, i) => {
    // Headers
    if (line.startsWith('### ')) return <h4 key={i} className="text-base font-bold my-1">{line.slice(4)}</h4>;
    if (line.startsWith('## ')) return <h3 key={i} className="text-lg font-bold my-1.5">{line.slice(3)}</h3>;
    if (line.startsWith('# ')) return <h2 key={i} className="text-xl font-extrabold my-2">{line.slice(2)}</h2>;
    
    // Checklist
    if (line.startsWith('- [ ] ')) return (
      <div key={i} className="flex items-center gap-2 my-0.5 opacity-80">
        <input type="checkbox" readOnly className="rounded cursor-default" />
        <span>{line.slice(6)}</span>
      </div>
    );
    if (line.startsWith('- [x] ') || line.startsWith('- [X] ')) return (
      <div key={i} className="flex items-center gap-2 my-0.5 line-through opacity-50">
        <input type="checkbox" readOnly checked className="rounded cursor-default" />
        <span>{line.slice(6)}</span>
      </div>
    );
    
    // Bullet list
    if (line.startsWith('- ') || line.startsWith('* ')) return (
      <li key={i} className="ml-4 list-disc my-0.5">{line.slice(2)}</li>
    );

    // Code block line / inline
    if (line.startsWith('```')) return null;

    if (line.trim() === '') return <div key={i} className="h-2"></div>;

    return <p key={i} className="my-0.5 leading-relaxed">{line}</p>;
  });
};

const COLOR_STYLES: Record<string, { light: string; dark: string; border: string }> = {
  yellow: { light: 'bg-amber-50 text-gray-800', dark: 'bg-amber-950/30 text-amber-100', border: 'border-amber-200 dark:border-amber-900/60' },
  blue: { light: 'bg-blue-50 text-gray-800', dark: 'bg-blue-950/30 text-blue-100', border: 'border-blue-200 dark:border-blue-900/60' },
  green: { light: 'bg-emerald-50 text-gray-800', dark: 'bg-emerald-950/30 text-emerald-100', border: 'border-emerald-200 dark:border-emerald-900/60' },
  purple: { light: 'bg-purple-50 text-gray-800', dark: 'bg-purple-950/30 text-purple-100', border: 'border-purple-200 dark:border-purple-900/60' },
  rose: { light: 'bg-rose-50 text-gray-800', dark: 'bg-rose-950/30 text-rose-100', border: 'border-rose-200 dark:border-rose-900/60' },
  slate: { light: 'bg-slate-50 text-gray-800', dark: 'bg-slate-900/60 text-slate-100', border: 'border-slate-200 dark:border-slate-800' },
};

export const NoteManager: React.FC<NoteManagerProps> = ({ data, onUpdate, notify, askConfirm, filter, isDark }) => {
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [editForm, setEditForm] = useState<{ title: string; content: string; color: NonNullable<Note['color']>; isPinned: boolean }>({ 
    title: "", 
    content: "", 
    color: "yellow", 
    isPinned: false 
  });
  const [previewMode, setPreviewMode] = useState(false);

  const save = () => {
    if (editingId === 'new') {
      const newNote: Note = { 
        id: Date.now(), 
        title: editForm.title.trim() || "Untitled Note", 
        content: editForm.content, 
        color: editForm.color,
        isPinned: editForm.isPinned,
        date: new Date().toLocaleDateString() 
      };
      onUpdate([newNote, ...data]);
      notify("Note created");
    } else {
      onUpdate(data.map(n => n.id === editingId ? { 
        ...n, 
        title: editForm.title.trim() || "Untitled Note", 
        content: editForm.content, 
        color: editForm.color,
        isPinned: editForm.isPinned,
        date: new Date().toLocaleDateString() 
      } : n));
      notify("Note saved");
    }
    setEditingId(null);
  };

  const startEdit = (note: Note) => {
    setEditingId(note.id);
    setEditForm({ 
      title: note.title, 
      content: note.content, 
      color: note.color || 'yellow', 
      isPinned: !!note.isPinned 
    });
    setPreviewMode(false);
  };

  const startNew = () => {
    setEditingId('new');
    setEditForm({ title: "", content: "", color: "yellow", isPinned: false });
    setPreviewMode(false);
  };

  const togglePin = (id: string | number, e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdate(data.map(n => n.id === id ? { ...n, isPinned: !n.isPinned } : n));
    notify("Pin status updated");
  };

  const exportNote = (note: Note, e: React.MouseEvent) => {
    e.stopPropagation();
    const content = `# ${note.title}\nDate: ${note.date}\n\n${note.content}`;
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${note.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'note'}.md`;
    a.click();
    URL.revokeObjectURL(url);
    notify("Note exported as Markdown");
  };

  const remove = (id: string | number) => {
    askConfirm("Delete this note permanently?", () => {
      onUpdate(data.filter(n => n.id !== id));
      notify("Note deleted");
    });
  };

  const moveItem = (from: number, to: number) => {
    const updated = [...data];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);
    onUpdate(updated);
  };

  // Sort pinned items to the top
  const sortedData = [...data].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return 0;
  });

  const filteredData = sortedData.filter(n => 
    n.title.toLowerCase().includes(filter.toLowerCase()) || 
    n.content.toLowerCase().includes(filter.toLowerCase())
  );

  const isDraggingDisabled = filter.length > 0;

  if (editingId) {
    return (
      <div className={`p-6 rounded-2xl shadow-xl flex flex-col fade-in h-[82vh] border ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-800'}`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-gray-200 dark:border-gray-700">
          <input 
            className={`text-2xl font-bold outline-none bg-transparent flex-1 ${isDark ? 'placeholder-gray-500 text-white' : 'placeholder-gray-300 text-gray-900'}`}
            placeholder="Note Title..." 
            value={editForm.title} 
            onChange={e => setEditForm({...editForm, title: e.target.value})} 
          />
          <div className="flex items-center gap-3 flex-wrap">
            {/* Color Palette Selector */}
            <div className="flex items-center gap-1.5 p-1 rounded-lg bg-gray-100 dark:bg-gray-700">
              {(['yellow', 'blue', 'green', 'purple', 'rose', 'slate'] as const).map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setEditForm({ ...editForm, color: c })}
                  className={`w-5 h-5 rounded-full transition-transform ${editForm.color === c ? 'scale-125 ring-2 ring-blue-500' : 'opacity-70 hover:opacity-100'}`}
                  style={{
                    backgroundColor: c === 'yellow' ? '#fbbf24' : c === 'blue' ? '#60a5fa' : c === 'green' ? '#34d399' : c === 'purple' ? '#c084fc' : c === 'rose' ? '#fb7185' : '#94a3b8'
                  }}
                  title={`Color: ${c}`}
                />
              ))}
            </div>

            {/* Pin Toggle */}
            <button
              type="button"
              onClick={() => setEditForm({ ...editForm, isPinned: !editForm.isPinned })}
              className={`p-2 rounded-lg border text-xs flex items-center gap-1 transition ${editForm.isPinned ? 'bg-amber-500 text-white border-amber-500' : 'border-gray-300 dark:border-gray-600 opacity-70 hover:opacity-100'}`}
              title={editForm.isPinned ? "Unpin Note" : "Pin Note to Top"}
            >
              <Icon path={icons.pin} className="w-3.5 h-3.5" />
              {editForm.isPinned ? 'Pinned' : 'Pin'}
            </button>

            {/* Markdown / Preview Toggle */}
            <div className="flex rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
              <button 
                type="button" 
                onClick={() => setPreviewMode(false)}
                className={`px-3 py-1 text-xs font-semibold ${!previewMode ? 'bg-blue-600 text-white' : 'bg-transparent opacity-70 hover:opacity-100'}`}
              >
                Write (MD)
              </button>
              <button 
                type="button" 
                onClick={() => setPreviewMode(true)}
                className={`px-3 py-1 text-xs font-semibold flex items-center gap-1 ${previewMode ? 'bg-blue-600 text-white' : 'bg-transparent opacity-70 hover:opacity-100'}`}
              >
                <Icon path={icons.eye} className="w-3 h-3" /> Preview
              </button>
            </div>
          </div>
        </div>

        {previewMode ? (
          <div className="flex-1 overflow-y-auto custom-scroll p-4 my-2 rounded-lg bg-gray-50 dark:bg-gray-900/50">
            {editForm.content.trim() ? (
              <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed">
                {renderMarkdown(editForm.content)}
              </div>
            ) : (
              <p className="text-gray-400 italic text-sm">Nothing to preview. Type something in Markdown mode!</p>
            )}
          </div>
        ) : (
          <textarea 
            className="flex-1 resize-none outline-none leading-relaxed custom-scroll bg-transparent p-3 my-2 text-inherit font-mono text-sm border-none" 
            placeholder="Write markdown here... Supports # Headers, - Lists, - [ ] Checklists, etc." 
            value={editForm.content} 
            onChange={e => setEditForm({...editForm, content: e.target.value})} 
          />
        )}

        <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
          <span className="text-xs opacity-50 font-mono">
            {editForm.content.length} characters | Markdown enabled
          </span>
          <div className="flex gap-3">
            <button onClick={() => setEditingId(null)} className="px-4 py-2 opacity-70 hover:opacity-100 rounded text-sm">Cancel</button>
            <button onClick={save} className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm shadow">Save Note</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Your private diary and rich Markdown notes with pinning and color-coding.</p>
        </div>
        <button onClick={startNew} title="New Note" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 shadow transition">
          <Icon path={icons.plus} className="w-3.5 h-3.5" /> New Note
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
        {filteredData.map((n, index) => {
          const colorKey = n.color || 'yellow';
          const style = COLOR_STYLES[colorKey] || COLOR_STYLES.yellow;

          return (
            <DraggableCard key={n.id} id={n.id} index={index} moveItem={moveItem} disabled={isDraggingDisabled}>
              <div className={`rounded-xl shadow-sm border cursor-default hover:shadow-md transition relative group h-64 flex flex-col w-full overflow-hidden ${style.border} ${isDark ? style.dark : style.light}`}>
                
                {/* Card Header with Pin & Title */}
                <div className="p-3.5 pb-2 flex justify-between items-start border-b border-black/5 dark:border-white/5">
                  <div className="flex items-center gap-2 truncate flex-1 pr-2" onClick={() => startEdit(n)}>
                    {n.isPinned && (
                      <span className="text-amber-500 flex-shrink-0" title="Pinned Note">
                        <Icon path={icons.pin} className="w-3.5 h-3.5" />
                      </span>
                    )}
                    <h3 className="font-bold text-base truncate cursor-pointer">{n.title}</h3>
                  </div>

                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                    <button 
                      onClick={(e) => togglePin(n.id, e)} 
                      title={n.isPinned ? "Unpin Note" : "Pin Note"}
                      className={`p-1 rounded transition hover:bg-black/10 dark:hover:bg-white/10 ${n.isPinned ? 'text-amber-500' : 'text-gray-400'}`}
                    >
                      <Icon path={icons.pin} className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={(e) => exportNote(n, e)} 
                      title="Export as Markdown (.md)"
                      className="p-1 rounded text-gray-400 hover:text-blue-500 hover:bg-black/10 dark:hover:bg-white/10 transition"
                    >
                      <Icon path={icons.download} className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); remove(n.id); }} 
                      title="Delete Note" 
                      className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-black/10 dark:hover:bg-white/10 transition"
                    >
                      <Icon path={icons.trash} className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Content preview */}
                <div className="flex-1 p-3.5 overflow-y-auto custom-scroll cursor-pointer text-xs leading-relaxed opacity-90" onClick={() => startEdit(n)}>
                  {renderMarkdown(n.content) || <span className="opacity-40 italic">Empty note</span>}
                </div>

                {/* Card Footer */}
                <div className="p-2.5 px-3.5 text-[11px] opacity-60 flex justify-between items-center border-t border-black/5 dark:border-white/5 bg-black/5 dark:bg-black/20">
                  <span>{n.date}</span>
                  <span className="font-mono text-[10px] uppercase opacity-75">{n.color || 'yellow'}</span>
                </div>
              </div>
            </DraggableCard>
          );
        })}
      </div>
    </div>
  );
};
export default NoteManager;
