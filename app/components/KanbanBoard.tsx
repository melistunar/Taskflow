"use client"
import React, { useState, useEffect } from 'react';
import { 
  DndContext, closestCorners, KeyboardSensor, MouseSensor, TouchSensor,
  useSensor, useSensors, DragEndEvent, DragOverEvent, DragOverlay
} from '@dnd-kit/core';
import { 
  arrayMove, sortableKeyboardCoordinates, SortableContext, 
  horizontalListSortingStrategy 
} from '@dnd-kit/sortable';
import { Column } from './Column';
import { TaskCard } from './TaskCard';
import { 
  PlusCircle, LogOut, Plus, Trash2, X, 
  Search, Lock, Users, LayoutGrid, AlertTriangle, UserPlus, LogIn, XCircle
} from 'lucide-react';

export default function KanbanBoard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [boards, setBoards] = useState<any>({});
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
  
  const [activeId, setActiveId] = useState<any>(null);
  const [activeType, setActiveType] = useState<'Column' | 'Task' | null>(null);
  const [taskModal, setTaskModal] = useState<{open: boolean, task: any, colId: string | null}>({open: false, task: null, colId: null});
  const [boardModalOpen, setBoardModalOpen] = useState(false);
  const [columnModalOpen, setColumnModalOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{open: boolean, title: string, onConfirm: () => void}>({open: false, title: '', onConfirm: () => {}});
  const [errorNotification, setErrorNotification] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (errorNotification) {
      const timer = setTimeout(() => setErrorNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [errorNotification]);

  useEffect(() => {
    const session = localStorage.getItem('taskflow_session');
    if (session) {
      setCurrentUser(session);
      refreshBoards(session);
      setIsLoggedIn(true);
    }
    setIsLoaded(true);
  }, []);

  const refreshBoards = (user: string) => {
    const globalBoards = JSON.parse(localStorage.getItem('taskflow_global_boards') || '{}');
    let accessibleBoards: any = {};
    Object.keys(globalBoards).forEach(bId => {
      const board = globalBoards[bId];
      if (board.owner === user || board.accessType !== 'private') accessibleBoards[bId] = board;
    });
    setBoards(accessibleBoards);
    const firstId = Object.keys(accessibleBoards)[0];
    if (firstId) setActiveBoardId(firstId);
  };

  const saveToGlobalStorage = (updatedBoards: any) => {
    const globalBoards = JSON.parse(localStorage.getItem('taskflow_global_boards') || '{}');
    const newGlobalData = { ...globalBoards, ...updatedBoards };
    localStorage.setItem('taskflow_global_boards', JSON.stringify(newGlobalData));
    setBoards(updatedBoards);
  };

  const currentBoard = activeBoardId ? boards[activeBoardId] : null;
  const canEdit = currentBoard?.owner === currentUser || currentBoard?.accessType === 'team-edit';

  const findContainer = (id: string) => {
    if (!currentBoard || !currentBoard.boardData) return null;
    const bData = currentBoard.boardData;
    if (id in bData) return id;
    return Object.keys(bData).find(key => bData[key].items.some((i: any) => i.id === id));
  };

  const updateActiveBoard = (newData: any, newOrder?: string[]) => {
    if (!canEdit || !activeBoardId) return;
    const updated = { ...boards, [activeBoardId]: { ...currentBoard, boardData: newData, columnOrder: newOrder || currentBoard.columnOrder } };
    saveToGlobalStorage(updated);
  };

  const handleDragStart = (e: any) => {
    if (!canEdit) return;
    setActiveId(e.active.id);
    setActiveType(e.active.data.current?.type === 'Column' ? 'Column' : 'Task');
  };

  const handleDragOver = (e: DragOverEvent) => {
    const { active, over } = e;
    if (!over || activeType === 'Column' || !canEdit) return;
    const activeContainer = findContainer(active.id as string);
    const overId = over.id as string;
    const overContainer = findContainer(overId) || overId;
    if (!activeContainer || !overContainer || activeContainer === overContainer) return;
    const nextData = { ...currentBoard.boardData };
    const activeItems = [...nextData[activeContainer].items];
    const overItems = [...(nextData[overContainer]?.items || [])];
    const activeIndex = activeItems.findIndex(i => i.id === active.id);
    const task = activeItems[activeIndex];
    activeItems.splice(activeIndex, 1);
    overItems.push(task);
    nextData[activeContainer].items = activeItems;
    nextData[overContainer].items = overItems;
    updateActiveBoard(nextData);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || !canEdit) { setActiveId(null); return; }
    const bData = { ...currentBoard.boardData };
    const cOrder = [...currentBoard.columnOrder];
    if (activeType === 'Column') {
      if (active.id !== over.id) {
        updateActiveBoard(bData, arrayMove(cOrder, cOrder.indexOf(active.id as string), cOrder.indexOf(over.id as string)));
      }
    } else {
      const activeContainer = findContainer(active.id as string);
      const overContainer = findContainer(over.id as string) || (over.id as string);
      if (activeContainer && activeContainer === overContainer) {
        const items = [...bData[activeContainer].items];
        const oldIdx = items.findIndex(i => i.id === active.id);
        const newIdx = items.findIndex(i => i.id === over.id);
        if (oldIdx !== newIdx) {
          bData[activeContainer].items = arrayMove(items, oldIdx, newIdx);
          updateActiveBoard(bData);
        }
      }
    }
    setActiveId(null);
  };

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = username.trim().toLowerCase();
    if (!clean) return;
    const allUsers = JSON.parse(localStorage.getItem('taskflow_users') || '{}');
    if (authMode === 'register') {
      if (allUsers[clean]) { setErrorNotification("Username taken!"); return; }
      allUsers[clean] = { created: Date.now() };
      localStorage.setItem('taskflow_users', JSON.stringify(allUsers));
      setAuthMode('login'); setUsername('');
    } else {
      if (!allUsers[clean]) { setErrorNotification("User not found!"); return; }
      setCurrentUser(clean); localStorage.setItem('taskflow_session', clean);
      refreshBoards(clean); setIsLoggedIn(true);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 px-4 text-slate-900">
        {errorNotification && (
          <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[300] bg-red-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
            <XCircle size={20} /> <span className="font-bold text-sm">{errorNotification}</span>
          </div>
        )}
        <div className="p-8 md:p-10 bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md text-center">
          <PlusCircle className="text-blue-600 mx-auto mb-4" size={56} />
          <h1 className="text-3xl font-black italic mb-2 tracking-tight">TaskFlow</h1>
          <form onSubmit={handleAuth} className="space-y-4 mt-8">
            <input 
              type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" 
              className="w-full px-5 py-4 bg-slate-50 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-medium" 
              required 
              onInvalid={(e: any) => e.target.setCustomValidity('Please enter your username')} 
              onInput={(e: any) => e.target.setCustomValidity('')}
            />
            <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2">
              {authMode === 'login' ? <LogIn size={20}/> : <UserPlus size={20}/>} {authMode === 'login' ? 'Login' : 'Register'}
            </button>
          </form>
          <button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className="mt-8 text-blue-600 font-bold underline block w-full text-center">
            {authMode === 'login' ? 'Create Account' : 'Back to Login'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
      <div className="hidden md:flex w-64 bg-white border-r flex-col p-6">
        <div className="flex items-center gap-2 mb-10"><PlusCircle className="text-blue-600" size={28} /><h1 className="text-xl font-black">TaskFlow</h1></div>
        <div className="flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-4"><h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">My Boards</h2><button onClick={() => setBoardModalOpen(true)} className="text-blue-600 p-1 rounded-md hover:bg-blue-50"><Plus size={16} /></button></div>
          {Object.keys(boards).map(id => (
            <div key={id} onClick={() => setActiveBoardId(id)} className={`group p-3 rounded-xl cursor-pointer mb-2 border ${activeBoardId === id ? "bg-blue-50 text-blue-700 border-blue-100 shadow-sm" : "border-transparent hover:bg-slate-50"}`}>
              <div className="flex items-center justify-between overflow-hidden text-slate-900 font-bold">
                <span className="text-sm truncate">{boards[id]?.title}</span>
                {boards[id]?.owner === currentUser && (
                  <button onClick={(e) => { e.stopPropagation(); setConfirmModal({ open: true, title: `Delete "${boards[id]?.title}"?`, onConfirm: () => { const n = {...boards}; delete n[id]; saveToGlobalStorage(n); if(activeBoardId === id) setActiveBoardId(null); setConfirmModal(p => ({...p, open: false})); } }); }} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500"><Trash2 size={14}/></button>
                )}
              </div>
            </div>
          ))}
        </div>
        <button onClick={() => { setIsLoggedIn(false); localStorage.removeItem('taskflow_session'); }} className="mt-auto text-red-500 font-bold text-sm text-left px-2">Logout</button>
      </div>

      <div className="flex-1 overflow-x-auto p-4 md:p-8">
        {!activeBoardId || !currentBoard ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-300"><LayoutGrid size={80} className="mb-4 opacity-10" /><p className="text-lg font-medium">Select or create a board</p></div>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between">
               <div><h1 className="text-2xl font-black text-slate-800">{currentBoard?.title}</h1>{!canEdit && <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-1 rounded-md font-bold uppercase">Team View</span>}</div>
            </div>
            <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
              <div className="flex gap-4 md:gap-6 items-start pb-10">
                <SortableContext items={currentBoard.columnOrder || []} strategy={horizontalListSortingStrategy}>
                  {(currentBoard.columnOrder || []).map((colId: string) => (
                    <Column key={colId} id={colId} title={currentBoard.boardData[colId]?.title} tasks={currentBoard.boardData[colId]?.items || []} isReadOnly={!canEdit}
                      onAddTask={() => setTaskModal({open: true, task: null, colId})}
                      onEditTask={(tid: any) => { const c = findContainer(tid)!; setTaskModal({open: true, task: currentBoard.boardData[c].items.find((i:any)=>i.id===tid), colId: c}); }}
                      onDeleteTask={(tid: any) => { setConfirmModal({ open: true, title: "Delete task?", onConfirm: () => { const c = findContainer(tid)!; const n = {...currentBoard.boardData}; n[c].items = n[c].items.filter((i:any)=>i.id!==tid); updateActiveBoard(n); setConfirmModal(p => ({...p, open: false})); } }); }}
                      onDeleteColumn={(cid: any) => { setConfirmModal({ open: true, title: "Delete column?", onConfirm: () => { const n = {...currentBoard.boardData}; delete n[cid]; updateActiveBoard(n, currentBoard.columnOrder.filter((id:any)=>id!==cid)); setConfirmModal(p => ({...p, open: false})); } }); }}
                    />
                  ))}
                </SortableContext>
                {canEdit && <button onClick={() => setColumnModalOpen(true)} className="flex-shrink-0 w-[280px] h-16 border-2 border-dashed border-slate-300 rounded-[2rem] flex items-center justify-center text-slate-400 font-bold hover:border-blue-500 hover:text-blue-600 transition-all">+ Add Column</button>}
              </div>
              <DragOverlay>{(activeId && activeType==='Task' && currentBoard) ? <TaskCard id={activeId} {...(Object.values(currentBoard.boardData).flatMap((d:any)=>d.items).find((i:any)=>i.id===activeId))} isOverlay onEdit={()=>{}} onDelete={()=>{}} /> : null}</DragOverlay>
            </DndContext>
          </>
        )}
      </div>

      {/* MODALS */}
      {confirmModal.open && (
        <div className="fixed inset-0 bg-slate-900/60 z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-8 text-center max-w-sm w-full shadow-2xl border border-white"><div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle className="text-red-500" size={32} /></div><h2 className="text-xl font-black mb-2 italic">Are you sure?</h2><p className="text-sm text-slate-500 mb-8">{confirmModal.title}</p><div className="flex gap-3"><button onClick={() => setConfirmModal(p => ({...p, open: false}))} className="flex-1 py-3 font-bold text-slate-400">Cancel</button><button onClick={confirmModal.onConfirm} className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl">Delete</button></div></div>
        </div>
      )}
      {taskModal.open && <TaskModal task={taskModal.task} onSave={(data:any) => { const bData = { ...currentBoard.boardData }; if (taskModal.task) bData[taskModal.colId!].items = bData[taskModal.colId!].items.map((i:any) => i.id === taskModal.task.id ? {...data, id: i.id} : i); else bData[taskModal.colId!].items.push({...data, id: `t-${Date.now()}`}); updateActiveBoard(bData); setTaskModal({open: false, task: null, colId: null}); }} onClose={() => setTaskModal({open: false, task: null, colId: null})} />}
      {boardModalOpen && <GenericInputModal title="New Board" label="Title" onSave={(title: any, access: any) => { const id = `b-${Date.now()}`; const newBoard = { title, owner: currentUser, accessType: access, boardData: { todo: { title: "To Do", items: [] }, doing: { title: "In Progress", items: [] }, done: { title: "Done", items: [] } }, columnOrder: ['todo', 'doing', 'done'] }; saveToGlobalStorage({ ...boards, [id]: newBoard }); setActiveBoardId(id); setBoardModalOpen(false); }} onClose={() => setBoardModalOpen(false)} hasAccessSelect />}
      {columnModalOpen && <GenericInputModal title="New Column" label="Title" onSave={(title: any) => { updateActiveBoard({...currentBoard.boardData, [`c-${Date.now()}`]:{title, items:[]}}, [...currentBoard.columnOrder, `c-${Date.now()}`]); setColumnModalOpen(false); }} onClose={() => setColumnModalOpen(false)} />}
    </div>
  );
}

function GenericInputModal({ title, label, onSave, onClose, hasAccessSelect }: any) {
  const [val, setVal] = useState('');
  const [access, setAccess] = useState('private');
  return (
    <div className="fixed inset-0 bg-slate-900/40 z-[110] flex items-center justify-center p-4 text-slate-900">
      <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl"><h2 className="text-xl font-black mb-6 italic">{title}</h2><div className="space-y-4"><div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</label><input autoFocus className="w-full mt-2 px-5 py-3 bg-slate-50 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold" value={val} onChange={e => setVal(e.target.value)} /></div>{hasAccessSelect && (<div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Access</label><select className="w-full mt-2 px-5 py-3 bg-slate-50 border rounded-2xl font-bold" value={access} onChange={e => setAccess(e.target.value)}><option value="private">Private</option><option value="team-view">Team View</option><option value="team-edit">Team Edit</option></select></div>)}<div className="flex gap-3 pt-4"><button onClick={onClose} className="flex-1 py-3 font-bold text-slate-400">Cancel</button><button onClick={() => val.trim() && onSave(val, access)} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg">Create</button></div></div></div>
    </div>
  );
}

function TaskModal({ task, onSave, onClose }: any) {
  const [searchTerm, setSearchTerm] = useState('');
  const [availableUsers, setAvailableUsers] = useState<string[]>([]);
  const [formData, setFormData] = useState({ title: task?.title || '', description: task?.description || '', priority: task?.priority || 'Low', dueDate: task?.dueDate || '', assignee: task?.assignee || '' });
  useEffect(() => { setAvailableUsers(Object.keys(JSON.parse(localStorage.getItem('taskflow_users') || '{}'))); }, []);
  const filteredUsers = availableUsers.filter(u => u.toLowerCase().includes(searchTerm.toLowerCase()));
  return (
    <div className="fixed inset-0 bg-slate-900/40 z-[100] flex items-center justify-center p-4 overflow-y-auto text-slate-900">
      <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-lg my-auto shadow-2xl">
        <div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-black italic">{task ? 'Edit Task' : 'New Task'}</h2><button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl"><X size={20}/></button></div>
        <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="space-y-4">
          <input 
            placeholder="Title" 
            className="w-full px-5 py-3 bg-slate-50 border rounded-2xl font-bold outline-none focus:ring-2 focus:ring-blue-500" 
            value={formData.title} 
            onChange={e => setFormData({...formData, title: e.target.value})} 
            required 
            onInvalid={(e: any) => e.target.setCustomValidity('Please enter a task title')} 
            onInput={(e: any) => e.target.setCustomValidity('')}
          />
          <textarea placeholder="Description" className="w-full px-5 py-3 bg-slate-50 border rounded-2xl h-20 resize-none outline-none" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          <div className="grid grid-cols-2 gap-4">
            <select className="px-5 py-3 bg-slate-50 border rounded-2xl font-bold" value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})}><option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option></select>
            <input type="date" className="px-5 py-3 bg-slate-50 border rounded-2xl font-bold" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Assignee</label>
            <div className="relative"><Search size={14} className="absolute left-4 top-3 text-slate-400" /><input placeholder="Search user..." className="w-full pl-10 pr-4 py-2 bg-blue-50/50 border border-blue-100 rounded-xl text-sm outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
            <select className="w-full px-5 py-3 bg-slate-50 border rounded-2xl font-bold" value={formData.assignee} onChange={e => setFormData({...formData, assignee: e.target.value})} size={searchTerm.length > 0 ? 3 : 1}><option value="">{searchTerm ? '-- Results --' : 'Select'}</option>{filteredUsers.map(u => <option key={u} value={u}>@{u}</option>)}</select>
          </div>
          <div className="flex gap-3 pt-4"><button type="button" onClick={onClose} className="flex-1 py-4 font-bold text-slate-400">Cancel</button><button type="submit" className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg">Save Task</button></div>
        </form>
      </div>
    </div>
  );
}
