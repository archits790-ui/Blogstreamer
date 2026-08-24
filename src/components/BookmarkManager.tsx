import React, { useState } from 'react';
import { Icon, icons } from './Icons';
import { Modal } from './Modal';
import type { Bookmark, BookmarkCollection } from '../types';

interface BookmarkManagerProps {
  data: BookmarkCollection[];
  onUpdate: (data: BookmarkCollection[]) => void;
  notify: (msg: string, type?: 'info' | 'error') => void;
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
      className="relative group transition-transform duration-200 h-full"
    >
      {children}
    </div>
  );
};

export const BookmarkManager: React.FC<BookmarkManagerProps> = ({ data, onUpdate, notify, filter, isDark }) => {
  const [editingId, setEditingId] = useState<string | number | null>(null);
  
  // Edit Form State
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formLinks, setFormLinks] = useState<Bookmark[]>([]);
  // Inputs for new link line
  const [newLinkName, setNewLinkName] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");

  const startEdit = (bm: BookmarkCollection | null = null) => {
    if (bm) {
      setEditingId(bm.id);
      setFormTitle(bm.title);
      setFormDesc(bm.desc || "");
      if (bm.links) {
        setFormLinks([...bm.links]);
      } else if (bm.url) {
        setFormLinks([{ name: "Main Link", url: bm.url }]);
      } else {
        setFormLinks([]);
      }
    } else {
      setEditingId('new');
      setFormTitle("");
      setFormDesc("");
      setFormLinks([]);
    }
    setNewLinkName("");
    setNewLinkUrl("");
  };

  const addLinkToForm = () => {
    if (!newLinkName || !newLinkUrl) return;
    setFormLinks([...formLinks, { name: newLinkName, url: newLinkUrl }]);
    setNewLinkName("");
    setNewLinkUrl("");
  };

  const removeLinkFromForm = (idx: number) => {
    const updated = [...formLinks];
    updated.splice(idx, 1);
    setFormLinks(updated);
  };

  const save = () => {
    if (!formTitle) return notify("Card Title is required", "error");
    
    const cardData = {
      title: formTitle,
      desc: formDesc,
      links: formLinks
    };

    if (editingId === 'new') {
      onUpdate([{ ...cardData, id: Date.now() }, ...data]);
    } else {
      onUpdate(data.map(b => b.id === editingId ? { ...b, ...cardData } : b));
    }
    setEditingId(null);
  };

  const remove = (id: string | number) => {
    onUpdate(data.filter(b => b.id !== id));
  };

  const moveItem = (from: number, to: number) => {
    const updated = [...data];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);
    onUpdate(updated);
  };

  const filteredData = data.filter(b => 
    b.title.toLowerCase().includes(filter.toLowerCase()) || 
    (b.desc && b.desc.toLowerCase().includes(filter.toLowerCase()))
  );

  const isDraggingDisabled = filter.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-gray-600 dark:text-gray-400">Securely stored bookmark collections.</p>
        <button onClick={() => startEdit(null)} title="New Collection" className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
          <Icon path={icons.plus} /> New Collection
        </button>
      </div>

      <Modal isOpen={!!editingId} onClose={() => setEditingId(null)} title={editingId === 'new' ? "New Bookmark Collection" : "Edit Collection"}>
         <div className="space-y-4 text-gray-800 dark:text-gray-100">
            <div>
              <label className="text-xs font-bold opacity-70 uppercase">Card Title</label>
              <input className={`w-full border p-2 rounded ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white text-black'}`} placeholder="e.g. Work Resources" value={formTitle} onChange={e => setFormTitle(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-bold opacity-70 uppercase">Description</label>
              <input className={`w-full border p-2 rounded ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white text-black'}`} placeholder="Optional details..." value={formDesc} onChange={e => setFormDesc(e.target.value)} />
            </div>
            
            <div className="border-t pt-4 dark:border-gray-700">
              <label className="text-sm font-bold block mb-2">Links List</label>
              <div className="flex flex-col gap-2 mb-2">
                <input className={`w-full border p-2 rounded text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white text-black'}`} placeholder="Link Name" value={newLinkName} onChange={e => setNewLinkName(e.target.value)} />
                <div className="flex flex-col sm:flex-row gap-2">
                  <input className={`flex-1 border p-2 rounded text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white text-black'}`} placeholder="URL (https://...)" value={newLinkUrl} onChange={e => setNewLinkUrl(e.target.value)} />
                  
                  <div className="flex gap-2">
                    <button onClick={addLinkToForm} title="Add Link" className="bg-green-600 text-white p-2 rounded hover:bg-green-700">
                      <Icon path={icons.plus} />
                    </button>
                  </div>
                </div>
              </div>

              <div className={`max-h-40 overflow-y-auto custom-scroll border rounded ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                {formLinks.length === 0 && <div className="p-4 text-center text-sm opacity-50">No links added yet.</div>}
                {formLinks.map((link, idx) => (
                  <div key={idx} className={`flex justify-between items-center p-2 text-sm border-b last:border-0 ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                    <div className="truncate pr-2">
                      <span className="font-semibold">{link.name}</span> <span className="opacity-50 text-xs">({link.url})</span>
                    </div>
                    <button onClick={() => removeLinkFromForm(idx)} title="Remove Link" className="text-red-500 hover:text-red-700">
                      <Icon path={icons.trash} className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end pt-2">
              <button onClick={save} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Save Collection</button>
            </div>
         </div>
      </Modal>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
        {filteredData.map((b, index) => (
          <DraggableCard key={b.id} id={b.id} index={index} moveItem={moveItem} disabled={isDraggingDisabled}>
            <div className={`p-0 rounded-lg shadow hover:shadow-lg transition border flex flex-col h-64 ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-100 text-gray-800'}`}>
              
              <div className={`p-3 border-b flex justify-between items-start ${isDark ? 'border-gray-700 bg-gray-750' : 'bg-gray-50 border-gray-100'}`}>
                <div className="flex-1 overflow-hidden">
                  <div className="font-bold text-lg truncate" title={b.title}>{b.title}</div>
                  {b.desc && <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{b.desc}</div>}
                </div>
                <div className="flex gap-1 ml-2">
                  <button onClick={() => startEdit(b)} title="Edit Collection" className="p-1 text-gray-400 hover:text-blue-500">
                    <Icon path={icons.edit} className="w-4 h-4" />
                  </button>
                  <button onClick={() => remove(b.id)} title="Delete Collection" className="p-1 text-gray-400 hover:text-red-500">
                    <Icon path={icons.trash} className="w-4 h-4" />
                  </button>
                  {!isDraggingDisabled && (
                    <div className="cursor-grab drag-handle p-1 text-gray-400 hover:text-gray-600" title="Drag to reorder">
                      <Icon path={icons.drag} className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scroll p-3">
                <div className="flex flex-col">
                  {(!b.links || b.links.length === 0) && b.url && (
                    <div className="py-2 border-b last:border-0 border-dashed dark:border-gray-700">
                      <div className="text-xs font-bold opacity-50 mb-1">1.</div>
                      <a href={b.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline block truncate">Main Link</a>
                    </div>
                  )}

                  {b.links && b.links.map((link, i) => (
                    <div key={i} className={`py-2 border-b last:border-0 border-dashed ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono opacity-50 w-4">{i + 1}.</span>
                        <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline truncate font-medium">
                          {link.name || link.url}
                        </a>
                      </div>
                    </div>
                  ))}
                  {(!b.links || b.links.length === 0) && !b.url && <div className="text-sm opacity-40 text-center py-4">No links</div>}
                </div>
              </div>
            </div>
          </DraggableCard>
        ))}
      </div>
    </div>
  );
};
export default BookmarkManager;
