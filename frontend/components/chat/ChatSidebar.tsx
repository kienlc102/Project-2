import { ArrowLeft, Plus, UserPlus } from "lucide-react";

interface Props {
  groups: any[];
  currentGroupId: number | null;
  onSelectGroup: (group: any) => void;
  onShowJoinModal: () => void;
  onShowCreateModal: () => void;
  onBack: () => void;
}

export default function ChatSidebar({
  groups, currentGroupId, onSelectGroup,
  onShowJoinModal, onShowCreateModal, onBack
}: Props) {
  return (
    <div className="w-[340px] flex flex-col bg-white rounded-2xl shadow-sm shrink-0 overflow-hidden">
      <div className="h-20 px-5 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition text-gray-700" title="Quay lại">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="font-extrabold text-xl text-gray-900 tracking-tight">Message</div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onShowJoinModal} title="Tham gia nhóm" className="p-2 hover:bg-gray-100 text-gray-600 rounded-full transition"><UserPlus className="w-5 h-5" /></button>
          <button onClick={onShowCreateModal} title="Tạo nhóm mới" className="p-2 hover:bg-gray-100 text-gray-600 rounded-full transition"><Plus className="w-5 h-5" /></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {groups.map((g) => (
          <div 
            key={g.id} 
            onClick={() => onSelectGroup(g)} 
            className={`flex items-center gap-3 p-2.5 mb-1 cursor-pointer rounded-xl transition ${currentGroupId === g.id ? "bg-gray-100" : "hover:bg-gray-50"}`}
          >
            <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-lg shrink-0">
              {g.groupName.charAt(0).toUpperCase()}
            </div>
            <div className="font-semibold text-gray-800 truncate">{g.groupName}</div>
          </div>
        ))}
        {groups.length === 0 && (
          <div className="p-6 text-center text-gray-400">Bạn chưa tham gia nhóm nào. Hãy tạo hoặc tham gia bằng mã!</div>
        )}
      </div>
    </div>
  );
}