interface Props {
  show: boolean;
  groupName: string;
  groupDesc: string;
  onGroupNameChange: (val: string) => void;
  onGroupDescChange: (val: string) => void;
  onClose: () => void;
  onCreate: () => void;
}

export default function CreateGroupModal({
  show, groupName, groupDesc,
  onGroupNameChange, onGroupDescChange, onClose, onCreate
}: Props) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-2xl w-96 shadow-xl">
        <h3 className="text-xl font-bold mb-4 text-gray-900">Tạo nhóm học tập</h3>
        <input type="text" value={groupName} onChange={(e) => onGroupNameChange(e.target.value)} placeholder="Tên nhóm..." className="w-full px-4 py-3 rounded-xl border border-gray-200 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <textarea value={groupDesc} onChange={(e) => onGroupDescChange(e.target.value)} placeholder="Mô tả nhóm (không bắt buộc)" className="w-full px-4 py-3 rounded-xl border border-gray-200 mb-5 focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"></textarea>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-gray-600 font-medium hover:bg-gray-100 transition">Hủy</button>
          <button onClick={onCreate} className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition">Tạo mới</button>
        </div>
      </div>
    </div>
  );
}
