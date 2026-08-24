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

export const NoteManager: React.FC<NoteManagerProps> = ({ data, onUpdate, notify, askConfirm, filter, isDark }) => {
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [editForm, setEditForm] = useState({ title: "", content: "" });

  const save = () => {
    if (editingId === 'new') {
      onUpdate([{ id: Date.now(), title: editForm.title || "Untitled", content: editForm.content, date: new Date().toLocaleDateString() }, ...data]);
      notify("Note created");
    } else {
      onUpdate(data.map(n => n.id === editingId ? { ...n, ...editForm, date: new Date().toLocaleDateString() } : n));
      notify("Note saved");
    }
    setEditingId(null);
  };

  const startEdit = (note: Note) => {
    setEditingId(note.id);
    setEditForm({ title: note.title, content: note.content });
  };

  const startNew = () => {
    setEditingId('new');
    setEditForm({ title: "", content: "" });
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

  const filteredData = data.filter(n => 
    n.title.toLowerCase().includes(filter.toLowerCase()) || 
    n.content.toLowerCase().includes(filter.toLowerCase())
  );

  const isDraggingDisabled = filter.length > 0;

  if (editingId) {
    return (
      <div className={`p-6 rounded-xl shadow-lg flex flex-col fade-in h-[80vh] ${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
        <input 
          className={`text-2xl font-bold mb-4 outline-none border-b pb-2 bg-transparent ${isDark ? 'border-gray-700 placeholder-gray-500 text-white' : 'border-gray-200 placeholder-gray-300 text-black'}`}
          placeholder="Note Title" 
          value={editForm.title} 
          onChange={e => setEditForm({...editForm, title: e.target.value})} 
        />
        <textarea 
          className="flex-1 resize-none outline-none leading-relaxed custom-scroll bg-transparent p-2 text-inherit" 
          placeholder="Write your secrets here..." 
          value={editForm.content} 
          onChange={e => setEditForm({...editForm, content: e.target.value})} 
        />
        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button onClick={() => setEditingId(null)} className="px-4 py-2 opacity-70 hover:opacity-100 rounded">Cancel</button>
          <button onClick={save} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save Note</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <p className="text-gray-600 dark:text-gray-400">Your private diary and notes.</p>
        <button onClick={startNew} title="New Note" className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700">
          <Icon path={icons.plus} /> New Note
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
        {filteredData.map((n, index) => (
          <DraggableCard key={n.id} id={n.id} index={index} moveItem={moveItem} disabled={isDraggingDisabled}>
            <div className={`rounded-lg shadow-sm border cursor-default hover:shadow-md transition relative group h-64 flex w-full ${isDark ? 'bg-yellow-900/20 border-yellow-900/50 text-yellow-100' : 'bg-yellow-50 border-yellow-100 text-gray-800'}`}>
              {!isDraggingDisabled && (
                <div className={`w-8 flex items-center justify-center cursor-grab drag-handle border-r rounded-l-lg select-none font-bold text-xl ${isDark ? 'text-yellow-600 bg-yellow-900/30 border-yellow-900/50' : 'text-yellow-600/50 bg-yellow-100/30 border-yellow-100/50 hover:text-yellow-700'}`} title="Drag to reorder">
                  ::
                </div>
              )}
              
              <div className="flex-1 p-4 flex flex-col overflow-hidden" onClick={() => startEdit(n)}>
                <h3 className={`font-bold mb-2 truncate cursor-pointer ${isDark ? 'text-yellow-200' : 'text-gray-900'}`}>{n.title}</h3>
                <p className="text-sm overflow-y-auto custom-scroll flex-1 leading-relaxed whitespace-pre-wrap cursor-pointer pr-1 text-gray-600 dark:text-yellow-100/80">{n.content}</p>
                <div className={`mt-2 text-xs opacity-60 flex justify-between items-center pt-2 border-t ${isDark ? 'border-yellow-800' : 'border-yellow-200'}`}>
                  <span>{n.date}</span>
                  <button onClick={(e) => {e.stopPropagation(); remove(n.id);}} title="Delete Note" className="p-1 hover:text-red-500 opacity-0 group-hover:opacity-100 transition">
                    <Icon path={icons.trash} />
                  </button>
                </div>
              </div>
            </div>
          </DraggableCard>
        ))}
      </div>
    </div>
  );
};
export default NoteManager;
