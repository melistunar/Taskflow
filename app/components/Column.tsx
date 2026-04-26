import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { TaskCard } from './TaskCard';
import { Plus, Trash2, GripHorizontal } from 'lucide-react';

export function Column({ id, title, tasks, onAddTask, onEditTask, onDeleteTask, onDeleteColumn, isReadOnly }: any) {
  const { attributes, listeners, setNodeRef: setSortableRef, transform, transition, isDragging } = useSortable({ 
    id, data: { type: 'Column' }, disabled: isReadOnly 
  });
  const { setNodeRef: setDroppableRef } = useDroppable({ id, disabled: isReadOnly });

  const style = { transform: CSS.Translate.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <div ref={setSortableRef} style={style} className="flex flex-col w-[280px] md:w-80 bg-slate-100/50 rounded-2xl p-4 border border-slate-200 min-h-[500px] flex-shrink-0 transition-colors">
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2">
          {!isReadOnly && (
            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 touch-none"><GripHorizontal size={18} /></div>
          )}
          <h2 className="font-bold text-slate-800 tracking-tight truncate w-32 md:w-auto">{title}</h2>
          <span className="bg-white border border-slate-200 text-slate-500 text-[10px] px-1.5 py-0.5 rounded-md font-bold">{tasks.length}</span>
        </div>
        {!isReadOnly && (
          <button onClick={() => onDeleteColumn(id)} className="text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
        )}
      </div>

      <div ref={setDroppableRef} className="flex-1 flex flex-col gap-1">
        <SortableContext items={tasks.map((t: any) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task: any) => (
            <TaskCard key={task.id} {...task} onEdit={onEditTask} onDelete={onDeleteTask} isReadOnly={isReadOnly} />
          ))}
        </SortableContext>
      </div>

      {!isReadOnly && (
        <button onClick={onAddTask} className="mt-4 flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-slate-300 rounded-2xl text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all text-sm font-bold">
          <Plus size={16} /> Add Task
        </button>
      )}
    </div>
  );
}
