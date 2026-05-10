import { FileText, Download, MoreVertical } from "lucide-react";
import { RefObject } from "react";

interface Props {
  msg: any;
  isMe: boolean;
  senderNameDisplay: string;
  displayName: string;
  activeMenu: string | null;
  menuRef: RefObject<HTMLDivElement | null>;
  onToggleMenu: (msgId: string) => void;
  onDeleteMessage: (msgId: string) => void;
  onDownload: (url: string, fileName: string) => void;
}

export default function ChatMessageBubble({
  msg, isMe, senderNameDisplay, displayName,
  activeMenu, menuRef, onToggleMenu, onDeleteMessage, onDownload
}: Props) {
  return (
    <div className={`flex items-center gap-2 ${isMe ? 'justify-end' : 'justify-start'} group`}>

      {/* BUTTONS - hiện khi hover, nằm bên trái bubble */}
      {isMe && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          {/* Nút Emoji */}
          <button className="p-2 bg-white border border-gray-200 rounded-full shadow-sm hover:bg-gray-50 text-gray-500 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <path d="M8 13s1.5 2 4 2 4-2 4-2" />
              <line x1="9" y1="9" x2="9.01" y2="9" />
              <line x1="15" y1="9" x2="15.01" y2="9" />
            </svg>
          </button>

          {/* Nút Reply */}
          <button className="p-2 bg-white border border-gray-200 rounded-full shadow-sm hover:bg-gray-50 text-gray-500 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <polyline points="9 14 4 9 9 4" />
              <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
            </svg>
          </button>

          {/* Nút 3 chấm + dropdown */}
          <div className="relative">
            <button
              onClick={() => onToggleMenu(msg._id)}
              className="p-2 bg-white border border-gray-200 rounded-full shadow-sm hover:bg-gray-50 text-gray-500 transition"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {activeMenu === msg._id && (
              <div ref={menuRef} className="absolute right-0 bottom-full mb-1.5 w-36 bg-white border border-gray-100 rounded-xl shadow-lg z-20 overflow-hidden">
                <button
                  className="flex w-full items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition"
                  onClick={() => {
                    onDeleteMessage(msg._id);
                    onToggleMenu(msg._id);
                  }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  Thu hồi
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* BUBBLE TIN NHẮN */}
      <div className={`chat-message ${isMe ? 'me' : 'them'} max-w-[70%]`}>
        {!isMe && (
          <div className="sender font-semibold text-xs text-gray-500 mb-1.5 ml-1">
            {senderNameDisplay}
          </div>
        )}

        {msg.messageType === 'image' && msg.fileUrl ? (
          <img
            src={msg.fileUrl}
            alt="Uploaded"
            onClick={() => window.open(msg.fileUrl)}
            className="max-w-[300px] rounded-2xl mt-1 cursor-pointer border border-gray-200"
          />
        ) : msg.messageType === 'file' && msg.fileUrl ? (
          <div className="flex items-center gap-4 bg-blue-50/50 p-4 rounded-2xl border border-blue-100 max-w-sm">
            <div className="p-2.5 bg-blue-100/50 rounded-xl text-blue-600 shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-extrabold text-sm truncate text-gray-900">{displayName}</div>
              <div className="text-xs text-gray-500 truncate mt-0.5">Tệp tin • 1.2 MB</div>
            </div>
            <button
              onClick={() => onDownload(msg.fileUrl, displayName)}
              className="p-2 hover:bg-blue-100 rounded-full transition text-blue-600 shrink-0"
            >
              <Download className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <span>{msg.content}</span>
        )}
      </div>

    </div>
  );
}
