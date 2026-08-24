import React, { useState, useRef } from 'react';
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

const getFaviconUrl = (url: string): string => {
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    return `https://www.google.com/s2/favicons?domain=${parsed.hostname}&sz=32`;
  } catch {
    return "";
  }
};

export const BookmarkManager: React.FC<BookmarkManagerProps> = ({ data, onUpdate, notify, filter, isDark }) => {
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Edit Form State
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formLinks, setFormLinks] = useState<Bookmark[]>([]);
  // Inputs for new link line
  const [newLinkName, setNewLinkName] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");

  // Extract unique categories
  const categories = Array.from(new Set(data.map(b => b.category).filter(Boolean))) as string[];

  const startEdit = (bm: BookmarkCollection | null = null) => {
    if (bm) {
      setEditingId(bm.id);
      setFormTitle(bm.title);
      setFormDesc(bm.desc || "");
      setFormCategory(bm.category || "");
      if (bm.links && bm.links.length > 0) {
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
      setFormCategory("");
      setFormLinks([]);
    }
    setNewLinkName("");
    setNewLinkUrl("");
  };

  const addLinkToForm = () => {
    if (!newLinkName || !newLinkUrl) return;
    let url = newLinkUrl.trim();
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }
    setFormLinks([...formLinks, { name: newLinkName.trim(), url }]);
    setNewLinkName("");
    setNewLinkUrl("");
  };

  const removeLinkFromForm = (idx: number) => {
    const updated = [...formLinks];
    updated.splice(idx, 1);
    setFormLinks(updated);
  };

  const save = () => {
    if (!formTitle.trim()) return notify("Card Title is required", "error");
    
    const cardData: Partial<BookmarkCollection> = {
      title: formTitle.trim(),
      desc: formDesc.trim(),
      category: formCategory.trim() || undefined,
      links: formLinks
    };

    if (editingId === 'new') {
      onUpdate([{ ...cardData, id: Date.now(), links: formLinks, title: formTitle.trim() } as BookmarkCollection, ...data]);
      notify("Collection created");
    } else {
      onUpdate(data.map(b => b.id === editingId ? { ...b, ...cardData } : b));
      notify("Collection updated");
    }
    setEditingId(null);
  };

  const remove = (id: string | number) => {
    onUpdate(data.filter(b => b.id !== id));
    notify("Collection deleted");
  };

  const moveItem = (from: number, to: number) => {
    const updated = [...data];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);
    onUpdate(updated);
  };

  // Export as Chrome / Netscape HTML bookmarks file
  const exportBookmarksHTML = () => {
    let html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>\n`;
    html += `<!-- This is an automatically generated file. It will be read and overwritten. -->\n`;
    html += `<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">\n`;
    html += `<TITLE>Bookmarks</TITLE>\n`;
    html += `<H1>Bookmarks</H1>\n`;
    html += `<DL><p>\n`;

    data.forEach(col => {
      html += `    <DT><H3>${col.title}</H3>\n    <DL><p>\n`;
      if (col.links && col.links.length > 0) {
        col.links.forEach(l => {
          html += `        <DT><A HREF="${l.url}">${l.name || l.url}</A>\n`;
        });
      } else if (col.url) {
        html += `        <DT><A HREF="${col.url}">${col.title}</A>\n`;
      }
      html += `    </DL><p>\n`;
    });

    html += `</DL><p>\n`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookmarks_export_${new Date().toISOString().slice(0, 10)}.html`;
    a.click();
    URL.revokeObjectURL(url);
    notify("Bookmarks exported as HTML");
  };

  // Import from Chrome / Netscape HTML bookmarks file
  const handleImportHTML = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');
        
        const importedCollections: BookmarkCollection[] = [];
        const h3Elements = doc.querySelectorAll('h3');

        if (h3Elements.length > 0) {
          h3Elements.forEach(h3 => {
            const title = h3.textContent || "Imported Folder";
            const dl = h3.nextElementSibling;
            const links: Bookmark[] = [];
            if (dl && dl.tagName === 'DL') {
              const aTags = dl.querySelectorAll('a');
              aTags.forEach(a => {
                if (a.href) {
                  links.push({ name: a.textContent || a.href, url: a.href });
                }
              });
            }
            if (links.length > 0) {
              importedCollections.push({
                id: Date.now() + Math.random(),
                title,
                category: "Imported",
                links
              });
            }
          });
        }

        // Also catch loose <a> tags if no folders
        if (importedCollections.length === 0) {
          const looseLinks: Bookmark[] = [];
          doc.querySelectorAll('a').forEach(a => {
            if (a.href) looseLinks.push({ name: a.textContent || a.href, url: a.href });
          });
          if (looseLinks.length > 0) {
            importedCollections.push({
              id: Date.now(),
              title: "Imported Bookmarks",
              category: "Imported",
              links: looseLinks
            });
          }
        }

        if (importedCollections.length > 0) {
          onUpdate([...importedCollections, ...data]);
          notify(`Imported ${importedCollections.length} bookmark collection(s)!`);
        } else {
          notify("No valid bookmarks found in file.", "error");
        }
      } catch (err) {
        console.error("HTML Import error:", err);
        notify("Failed to parse bookmark file", "error");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const filteredData = data.filter(b => {
    const matchesFilter = b.title.toLowerCase().includes(filter.toLowerCase()) || 
      (b.desc && b.desc.toLowerCase().includes(filter.toLowerCase())) ||
      (b.category && b.category.toLowerCase().includes(filter.toLowerCase())) ||
      (b.links && b.links.some(l => l.name.toLowerCase().includes(filter.toLowerCase()) || l.url.toLowerCase().includes(filter.toLowerCase())));
    
    const matchesCategory = selectedCategory === "all" || b.category === selectedCategory;
    return matchesFilter && matchesCategory;
  });

  const isDraggingDisabled = filter.length > 0 || selectedCategory !== "all";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Securely stored & categorized bookmark collections with live favicons.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImportHTML} 
            accept=".html,.htm" 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()} 
            title="Import HTML Bookmarks from Browser" 
            className="text-xs font-semibold px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-1.5 transition"
          >
            <Icon path={icons.upload} className="w-3.5 h-3.5" /> Import HTML
          </button>
          <button 
            onClick={exportBookmarksHTML} 
            title="Export Bookmarks as Browser HTML" 
            className="text-xs font-semibold px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-1.5 transition"
          >
            <Icon path={icons.download} className="w-3.5 h-3.5" /> Export HTML
          </button>
          <button 
            onClick={() => startEdit(null)} 
            title="New Collection" 
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow transition"
          >
            <Icon path={icons.plus} className="w-3.5 h-3.5" /> New Collection
          </button>
        </div>
      </div>

      {/* Category Filter Chips */}
      {categories.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <span className="text-xs font-bold uppercase opacity-50 flex items-center gap-1">
            <Icon path={icons.tag} className="w-3.5 h-3.5" /> Category:
          </span>
          <button 
            onClick={() => setSelectedCategory("all")}
            className={`text-xs px-3 py-1 rounded-full transition ${selectedCategory === 'all' ? 'bg-blue-600 text-white font-medium shadow-sm' : 'bg-gray-200 dark:bg-gray-700 opacity-80 hover:opacity-100'}`}
          >
            All ({data.length})
          </button>
          {categories.map(cat => (
            <button 
              key={cat} 
              onClick={() => setSelectedCategory(cat)}
              className={`text-xs px-3 py-1 rounded-full transition ${selectedCategory === cat ? 'bg-blue-600 text-white font-medium shadow-sm' : 'bg-gray-200 dark:bg-gray-700 opacity-80 hover:opacity-100'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      <Modal isOpen={!!editingId} onClose={() => setEditingId(null)} title={editingId === 'new' ? "New Bookmark Collection" : "Edit Collection"}>
         <div className="space-y-4 text-gray-800 dark:text-gray-100">
            <div>
              <label className="text-xs font-bold opacity-70 uppercase">Collection Title</label>
              <input className={`w-full border p-2 rounded ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white text-black'}`} placeholder="e.g. Developer Tools" value={formTitle} onChange={e => setFormTitle(e.target.value)} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold opacity-70 uppercase">Category / Tag</label>
                <input className={`w-full border p-2 rounded text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white text-black'}`} placeholder="e.g. Work, Crypto, Tech" value={formCategory} onChange={e => setFormCategory(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-bold opacity-70 uppercase">Description</label>
                <input className={`w-full border p-2 rounded text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white text-black'}`} placeholder="Optional details..." value={formDesc} onChange={e => setFormDesc(e.target.value)} />
              </div>
            </div>
            
            <div className="border-t pt-4 dark:border-gray-700">
              <label className="text-sm font-bold block mb-2">Links List</label>
              <div className="flex flex-col gap-2 mb-2">
                <input className={`w-full border p-2 rounded text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white text-black'}`} placeholder="Link Name (e.g. GitHub)" value={newLinkName} onChange={e => setNewLinkName(e.target.value)} />
                <div className="flex flex-col sm:flex-row gap-2">
                  <input className={`flex-1 border p-2 rounded text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white text-black'}`} placeholder="URL (e.g. https://github.com)" value={newLinkUrl} onChange={e => setNewLinkUrl(e.target.value)} />
                  
                  <div className="flex gap-2">
                    <button onClick={addLinkToForm} title="Add Link" className="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 flex items-center gap-1 text-sm font-semibold">
                      <Icon path={icons.plus} className="w-4 h-4" /> Add
                    </button>
                  </div>
                </div>
              </div>

              <div className={`max-h-40 overflow-y-auto custom-scroll border rounded ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                {formLinks.length === 0 && <div className="p-4 text-center text-sm opacity-50">No links added yet.</div>}
                {formLinks.map((link, idx) => (
                  <div key={idx} className={`flex justify-between items-center p-2 text-sm border-b last:border-0 ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                    <div className="flex items-center gap-2 truncate pr-2">
                      <img 
                        src={getFaviconUrl(link.url)} 
                        alt="" 
                        className="w-4 h-4 rounded-sm flex-shrink-0" 
                        onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                      />
                      <span className="font-semibold">{link.name}</span> 
                      <span className="opacity-50 text-xs truncate">({link.url})</span>
                    </div>
                    <button onClick={() => removeLinkFromForm(idx)} title="Remove Link" className="text-red-500 hover:text-red-700 p-1">
                      <Icon path={icons.trash} className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end pt-2">
              <button onClick={save} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-medium">Save Collection</button>
            </div>
         </div>
      </Modal>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
        {filteredData.map((b, index) => (
          <DraggableCard key={b.id} id={b.id} index={index} moveItem={moveItem} disabled={isDraggingDisabled}>
            <div className={`p-0 rounded-xl shadow-sm hover:shadow-md transition border flex flex-col h-64 overflow-hidden ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-800'}`}>
              
              <div className={`p-3.5 border-b flex justify-between items-start ${isDark ? 'border-gray-700 bg-gray-900/40' : 'bg-gray-50/80 border-gray-200'}`}>
                <div className="flex-1 overflow-hidden pr-2">
                  <div className="flex items-center gap-2">
                    <div className="font-bold text-base truncate" title={b.title}>{b.title}</div>
                    {b.category && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider ${isDark ? 'bg-blue-900/50 text-blue-300 border border-blue-800' : 'bg-blue-100 text-blue-700'}`}>
                        {b.category}
                      </span>
                    )}
                  </div>
                  {b.desc && <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{b.desc}</div>}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => startEdit(b)} title="Edit Collection" className="p-1 text-gray-400 hover:text-blue-500 rounded">
                    <Icon path={icons.edit} className="w-4 h-4" />
                  </button>
                  <button onClick={() => remove(b.id)} title="Delete Collection" className="p-1 text-gray-400 hover:text-red-500 rounded">
                    <Icon path={icons.trash} className="w-4 h-4" />
                  </button>
                  {!isDraggingDisabled && (
                    <div className="cursor-grab drag-handle p-1 text-gray-400 hover:text-gray-600 rounded" title="Drag to reorder">
                      <Icon path={icons.drag} className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scroll p-3">
                <div className="flex flex-col gap-1">
                  {(!b.links || b.links.length === 0) && b.url && (
                    <div className={`py-1.5 px-2 rounded-lg transition flex items-center justify-between group ${isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}`}>
                      <div className="flex items-center gap-2.5 truncate">
                        <img 
                          src={getFaviconUrl(b.url)} 
                          alt="" 
                          className="w-4 h-4 rounded-sm flex-shrink-0"
                          onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                        />
                        <a href={b.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 dark:text-blue-400 hover:underline truncate font-medium text-sm">
                          Main Link
                        </a>
                      </div>
                      <Icon path={icons.externalLink} className="w-3.5 h-3.5 opacity-0 group-hover:opacity-60 text-gray-400 flex-shrink-0" />
                    </div>
                  )}

                  {b.links && b.links.map((link, i) => (
                    <div key={i} className={`py-1.5 px-2 rounded-lg transition flex items-center justify-between group ${isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}`}>
                      <div className="flex items-center gap-2.5 truncate">
                        <img 
                          src={getFaviconUrl(link.url)} 
                          alt="" 
                          className="w-4 h-4 rounded-sm flex-shrink-0"
                          onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                        />
                        <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline truncate font-medium text-sm">
                          {link.name || link.url}
                        </a>
                      </div>
                      <Icon path={icons.externalLink} className="w-3.5 h-3.5 opacity-0 group-hover:opacity-60 text-gray-400 flex-shrink-0" />
                    </div>
                  ))}
                  {(!b.links || b.links.length === 0) && !b.url && <div className="text-sm opacity-40 text-center py-6">No links in this collection</div>}
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
