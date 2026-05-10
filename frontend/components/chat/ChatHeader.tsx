import { Video, Info } from "lucide-react";

interface Props {
  currentGroup: any;
  membersCount: number;
  onShowGroupInfo: () => void;
  onVideoCall: () => void;
  isCallActive: boolean;
}

export default function ChatHeader({
  currentGroup, membersCount, onShowGroupInfo, onVideoCall, isCallActive
}: Props) {
  return (
    <div className="h-20 px-6 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
      <div className="flex items-center gap-3.5 font-semibold text-lg text-gray-800 cursor-pointer" onClick={onShowGroupInfo}>
        <div className="w-11 h-11 bg-blue-500 text-white flex items-center justify-center rounded-full font-bold">
          {currentGroup.groupName.charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="font-bold tracking-tight">{currentGroup.groupName}</div>
          <div className="text-xs font-normal text-gray-500 mt-0.5">{membersCount} thành viên</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onVideoCall}
          title={isCallActive ? "Đang có cuộc gọi — Bấm để tham gia" : "Gọi Video"}
          className={`p-2.5 rounded-full transition relative ${
            isCallActive
              ? "bg-green-500 text-white hover:bg-green-600"
              : "hover:bg-gray-100 text-gray-600"
          }`}
        >
          <Video className="w-5 h-5" />
          {isCallActive && (
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full animate-ping" />
          )}
        </button>
        <button onClick={onShowGroupInfo} title="Thông tin nhóm" className="p-2.5 hover:bg-gray-100 rounded-full transition text-gray-600">
          <Info className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}