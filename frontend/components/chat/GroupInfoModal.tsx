import { X, LogOut, Trash2, UserMinus, Copy } from "lucide-react";

interface Props {
  show: boolean;
  currentGroup: any;
  groupDetails: any;
  membersList: any[];
  myUserId: string;
  isAdmin: boolean;
  onClose: () => void;
  onLeaveGroup: () => void;
  onDeleteGroup: () => void;
  onKickMember: (memberId: string, memberName: string) => void;
  onShowToast: (msg: string) => void;
}

export default function GroupInfoModal({
  show, currentGroup, groupDetails, membersList,
  myUserId, isAdmin, onClose, onLeaveGroup, onDeleteGroup, onKickMember, onShowToast
}: Props) {
  if (!show || !groupDetails) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl w-[400px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-400 hover:bg-gray-100 rounded-full transition">
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 border-b border-gray-100 flex flex-col items-center">
          <div className="w-20 h-20 bg-blue-500 text-white text-3xl font-bold flex items-center justify-center rounded-2xl mb-4 shadow-sm">
            {currentGroup.groupName.charAt(0).toUpperCase()}
          </div>
          <h2 className="text-xl font-extrabold text-gray-900">{currentGroup.groupName}</h2>
          {groupDetails.description && <p className="text-gray-500 text-center mt-2 text-sm">{groupDetails.description}</p>}
        </div>

        {/* Invite Code */}
        {groupDetails.inviteCode && (
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Mã tham gia</div>
              <div className="font-mono font-bold text-gray-800 tracking-widest">{groupDetails.inviteCode}</div>
            </div>
            <button onClick={() => { navigator.clipboard.writeText(groupDetails.inviteCode); onShowToast("Đã copy mã tham gia!"); }} className="p-2 bg-white border shadow-sm rounded-lg hover:bg-gray-50 text-gray-600" title="Copy mã">
              <Copy className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Members List */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">Thành viên ({membersList.length})</div>
          <div className="space-y-1">
            {membersList.map((member: any) => (
              <div key={member.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-xl transition group">
                <div className="flex items-center gap-3">
                  {member.avatarUrl ? (
                    <img src={member.avatarUrl} alt="avt" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-500">{member.fullName?.charAt(0) || "U"}</div>
                  )}
                  <div>
                    <div className="font-semibold text-gray-900 flex items-center gap-2">
                      {member.fullName}
                      {/* ✅ SỬ DỤNG TRƯỜNG createdBy Ở ĐÂY ĐỂ HIỂN THỊ TAG TRƯỞNG NHÓM */}
                      {String(member.id) === String(groupDetails.createdBy) && <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] rounded-full uppercase font-bold tracking-wider">Trưởng nhóm</span>}
                    </div>
                    <div className="text-xs text-gray-500">{member.email || "Thành viên"}</div>
                  </div>
                </div>
                {/* Nút Đuổi (Chỉ hiện nếu mình là Admin và người này không phải là mình) */}
                {isAdmin && String(member.id) !== myUserId && (
                  <button onClick={() => onKickMember(member.id, member.fullName)} className="p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition opacity-0 group-hover:opacity-100" title="Mời ra khỏi nhóm">
                    <UserMinus className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Hành động dưới cùng */}
        <div className="p-4 border-t border-gray-100 flex flex-col gap-2">
          <button onClick={onLeaveGroup} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-xl transition">
            <LogOut className="w-5 h-5" /> Rời khỏi nhóm
          </button>
          {isAdmin && (
            <button onClick={onDeleteGroup} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-xl transition mt-2">
              <Trash2 className="w-5 h-5" /> Giải tán nhóm
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
