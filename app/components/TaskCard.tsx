import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Pencil, Trash2, GripVertical, Calendar, AlertCircle } from 'lucide-react';

export function TaskCard({ id, title, description, priority = 'Low', dueDate, assignee, onEdit, onDelete, isOverlay, isReadOnly }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled: isReadOnly });

  const priorityConfig = {
    High: { line: "bg-red-500", pill: "bg-red-50 text-red-700 border-red-100", label: "High" },
    Medium: { line: "bg-slate-400", pill: "bg-slate-50 text-slate-600 border-slate-100", label: "Medium" },
    Low: { line: "bg-emerald-500", pill: "bg-emerald-50 text-emerald-700 border-emerald-100", label: "Low" }
  };
  const currentP = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.Low;

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging && !isOverlay ? 0.3 : 1,
    scale: isOverlay ? 1.05 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={`group relative mb-3 bg-white rounded-[1.25rem] shadow-sm border transition-all overflow-hidden ${isOverlay ? "border-blue-400 rotate-2" : "border-slate-200 hover:border-blue-200"}`}>
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${currentP.line}`} />
      <div className="p-4 pl-5">
        <div className="flex items-start gap-3">
          {!isReadOnly && (
            <div {...attributes} {...listeners} className="text-slate-300 mt-1 cursor-grab active:cursor-grabbing hover:text-slate-400 touch-none"><GripVertical size={16} /></div>
          )}
          <div className="flex-1 pr-10">
            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase mb-2 border ${currentP.pill}`}>
              <AlertCircle size={10} />{currentP.label}
            </div>
            <h3 className="text-sm font-bold text-slate-800 leading-tight mb-1 break-words">{title}</h3>
            {description && <p className="text-xs text-slate-500 italic mb-3 line-clamp-2">{description}</p>}
            <div className="flex items-center gap-3 mt-2 pt-3 border-t border-slate-50">
              {dueDate && <div className="text-[10px] text-slate-400 font-bold flex items-center gap-1"><Calendar size={12}/>{dueDate}</div>}
              {assignee && <div className="text-[10px] text-slate-500 font-bold ml-auto truncate max-w-[80px]">@{assignee}</div>}
            </div>
          </div>
        </div>
      </div>
      {!isReadOnly && !isOverlay && (
        <div className="absolute right-2 top-3 flex flex-col gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(id)} className="p-2 hover:bg-blue-50 rounded-xl text-slate-400 hover:text-blue-600 shadow-sm bg-white"><Pencil size={14} /></button>
          <button onClick={() => onDelete(id)} className="p-2 hover:bg-red-50 rounded-xl text-slate-400 hover:text-red-500 shadow-sm bg-white"><Trash2 size={14} /></button>
        </div>
      )}
    </div>
  );
}
