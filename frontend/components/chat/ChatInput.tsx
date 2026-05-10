import { Paperclip, Send } from "lucide-react";
import { RefObject } from "react";

interface Props {
  inputText: string;
  isUploading: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onInputChange: (val: string) => void;
  onSend: () => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function ChatInput({
  inputText, isUploading, fileInputRef,
  onInputChange, onSend, onFileUpload
}: Props) {
  return (
    <div className="p-4 bg-white flex items-center gap-3 shrink-0">
      <input type="file" ref={fileInputRef} onChange={onFileUpload} className="hidden" />
      <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className={`p-3 rounded-full transition ${isUploading ? "text-gray-300" : "text-gray-400 hover:text-blue-600 hover:bg-blue-50"}`}>
        <Paperclip className="w-5 h-5" />
      </button>
      <div className="flex-1 flex items-center bg-gray-100 rounded-full px-5 py-2.5 focus-within:bg-gray-50 focus-within:ring-2 focus-within:ring-blue-100 transition">
        <input type="text" value={inputText} onChange={(e) => onInputChange(e.target.value)} onKeyDown={(e) => e.key === "Enter" && onSend()} placeholder={isUploading ? "Đang tải tệp lên..." : "Nhắn tin..."} disabled={isUploading} className="flex-1 bg-transparent outline-none text-gray-800 placeholder-gray-400" />
        <button onClick={onSend} disabled={!inputText.trim() || isUploading} className={`ml-3 transition ${inputText.trim() ? "text-blue-500" : "text-blue-200"}`}><Send className="w-5 h-5" /></button>
      </div>
    </div>
  );
}