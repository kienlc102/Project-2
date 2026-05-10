import { RefObject } from "react";
import ChatMessageBubble from "./ChatMessageBubble";

interface Props {
  messages: any[];
  myUserId: string;
  membersMap: Record<string, any>;
  activeMenu: string | null;
  menuRef: RefObject<HTMLDivElement | null>;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  onToggleMenu: (msgId: string) => void;
  onDeleteMessage: (msgId: string) => void;
  onDownload: (url: string, fileName: string) => void;
}

export default function ChatMessageList({
  messages, myUserId, membersMap, activeMenu,
  menuRef, messagesEndRef, onToggleMenu, onDeleteMessage, onDownload
}: Props) {
  return (
    <div className="flex-1 p-6 overflow-y-auto bg-white space-y-6">
      {messages.map((msg, idx) => {
        if (msg.messageType === "system") {
          return (
            <div key={idx} className="flex justify-center my-2">
              <span className="text-xs text-gray-400 bg-gray-100 px-4 py-1.5 rounded-full">
                {msg.content}
              </span>
            </div>
          );
        }

        const isMe = String(msg.senderId) === myUserId;
        const displayName = msg.fileName || msg.content || "Tệp đính kèm";
        const senderInfo = membersMap[String(msg.senderId)];
        const senderNameDisplay = senderInfo?.fullName || msg.senderName || msg.senderId;

        return (
          <ChatMessageBubble
            key={idx}
            msg={msg}
            isMe={isMe}
            senderNameDisplay={senderNameDisplay}
            displayName={displayName}
            activeMenu={activeMenu}
            menuRef={menuRef}
            onToggleMenu={onToggleMenu}
            onDeleteMessage={onDeleteMessage}
            onDownload={onDownload}
          />
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
}