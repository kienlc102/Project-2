interface Props {
  show: boolean;
  joinCode: string;
  onJoinCodeChange: (val: string) => void;
  onClose: () => void;
  onJoin: () => void;
}

export default function JoinGroupModal({
  show, joinCode, onJoinCodeChange, onClose, onJoin
}: Props) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-2xl w-96 shadow-xl">
        <h3 className="text-xl font-bold mb-2 text-gray-900">Tham gia bằng mã</h3>
        <p className="text-gray-500 mb-4 text-sm">Nhập mã tham gia do trưởng nhóm cung cấp</p>
        <input type="text" value={joinCode} onChange={(e) => onJoinCodeChange(e.target.value)} placeholder="Mã nhóm (Ví dụ: 856be583-2)" className="w-full px-4 py-3 rounded-xl border border-gray-200 mb-5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-gray-600 font-medium hover:bg-gray-100 transition">Hủy</button>
          <button onClick={onJoin} className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition">Tham gia</button>
        </div>
      </div>
    </div>
  );
}
