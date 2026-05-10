'use client';

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/auth";

import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatHeader from "@/components/chat/ChatHeader";
import ChatMessageList from "@/components/chat/ChatMessageList";
import ChatInput from "@/components/chat/ChatInput";
import CreateGroupModal from "@/components/chat/CreateGroupModal";
import JoinGroupModal from "@/components/chat/JoinGroupModal";
import GroupInfoModal from "@/components/chat/GroupInfoModal";

const NODE_SERVER = "http://localhost:5001";
const GROUP_API_BASE = "http://localhost:8080/api/groups";

export default function ChatPage() {
  const router = useRouter();
  const [socket, setSocket] = useState<any>(null);
  const [myUserId, setMyUserId] = useState("");
  const [groups, setGroups] = useState<any[]>([]);
  const [currentGroup, setCurrentGroup] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  
  const [membersMap, setMembersMap] = useState<Record<string, any>>({});
  const [membersList, setMembersList] = useState<any[]>([]);
  const [groupDetails, setGroupDetails] = useState<any>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");

  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState("");

  const [showGroupInfo, setShowGroupInfo] = useState(false);

  const [activeCall, setActiveCall] = useState<string | null>(null);
  const [incomingCall, setIncomingCall] = useState<{groupId: string; groupName: string} | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const currentGroupRef = useRef<any>(null);

  const getAuthHeaders = () => {
    const token = getToken();
    let userId = "";
    try {
      const payload = JSON.parse(atob(token?.split(".")[1] || ""));
      userId = String(payload.userId || payload.sub);
    } catch (e) {}
    return {
      "Authorization": `Bearer ${token}`,
      "X-User-Id": userId,
      "Content-Type": "application/json",
    };
  };

  const fetchMyGroups = async () => {
    try {
      const res = await fetch(`${GROUP_API_BASE}/my-groups`, { headers: getAuthHeaders() });
      if (res.ok) setGroups(await res.json());
    } catch (err) { console.error("Lỗi lấy danh sách nhóm:", err); }
  };

  useEffect(() => {
    let currentSocket: any = null;

    const initChat = async () => {
      const token = getToken();
      if (!token) {
        showToast("Vui lòng đăng nhập!");
        router.push("/login");
        return;
      }

      const headers = getAuthHeaders();
      setMyUserId(headers["X-User-Id"]);

      await fetchMyGroups();

      const { io } = await import("socket.io-client");
      currentSocket = io(NODE_SERVER, { auth: { token } });
      setSocket(currentSocket);

      // Join tất cả rooms của các nhóm đã tham gia (để nhận thông báo cuộc gọi)
      const groupsRes = await fetch(`${GROUP_API_BASE}/my-groups`, { headers: getAuthHeaders() });
      if (groupsRes.ok) {
        const myGroups = await groupsRes.json();
        myGroups.forEach((g: any) => currentSocket.emit("join_room", String(g.id)));
      }

      currentSocket.on("receive_message", (msg: any) => {
        // Chỉ hiển thị tin nhắn của nhóm đang xem
        if (String(msg.groupId) === String(currentGroupRef.current?.id)) {
          setMessages((prev) => [...prev, msg]);
        }
      });

      currentSocket.on("message_deleted", ({ messageId, groupId }: { messageId: string; groupId?: string }) => {
        setMessages((prev) => prev.filter((m) => m._id !== messageId));
      });

      currentSocket.on("incoming_call", (data: { groupId: string; groupName: string }) => {
        setActiveCall(data.groupId);
        setIncomingCall(data);
      });

      currentSocket.on("call_status", (data: { groupId: string; count: number }) => {
        if (data.count > 0) {
          setActiveCall(data.groupId);
        } else {
          setActiveCall(prev => prev === data.groupId ? null : prev);
          setIncomingCall(prev => prev?.groupId === data.groupId ? null : prev);
        }
      });
    };

    initChat();
    return () => { if (currentSocket) currentSocket.close(); };
  }, [router]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setActiveMenu(null);
    };
    if (activeMenu) document.addEventListener("mousedown", handleClickOutside);
    else document.removeEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeMenu]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const selectGroup = async (group: any) => {
    setCurrentGroup(group);
    currentGroupRef.current = group;
    setMessages([]);
    setShowGroupInfo(false);
    if (socket) socket.emit("join_room", String(group.id));

    const headers = getAuthHeaders();

    try {
      const res = await fetch(`${NODE_SERVER}/api/messages/${group.id}`);
      if (res.ok) setMessages(await res.json());

      const detailRes = await fetch(`${GROUP_API_BASE}/${group.id}`, { headers });
      if (detailRes.ok) setGroupDetails(await detailRes.json());

      const memRes = await fetch(`${GROUP_API_BASE}/${group.id}/members`, { headers });
      if (memRes.ok) {
        const memData = await memRes.json();
        setMembersList(memData);
        const map: Record<string, any> = {};
        memData.forEach((user: any) => { map[String(user.id)] = user; });
        setMembersMap(map);
      }
    } catch (err) { console.error("Lỗi tải data nhóm:", err); }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) { showToast("Tên nhóm không được để trống!"); return; }
    try {
      const res = await fetch(GROUP_API_BASE, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ groupName: newGroupName, description: newGroupDesc })
      });
      if (res.ok) {
        showToast("Tạo nhóm thành công!");
        setShowCreateModal(false);
        setNewGroupName(""); setNewGroupDesc("");
        fetchMyGroups(); 
      } else showToast("Tạo nhóm thất bại!");
    } catch (err) { console.error(err); }
  };

  const handleJoinGroup = async () => {
    if (!joinCode.trim()) { showToast("Vui lòng nhập mã tham gia!"); return; }
    try {
      const res = await fetch(`${GROUP_API_BASE}/join`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ inviteCode: joinCode })
      });
      if (res.ok) {
        showToast("Tham gia nhóm thành công!");
        setShowJoinModal(false);
        setJoinCode("");

        // Tìm nhóm mới vừa tham gia để gửi thông báo hệ thống
        const oldGroupIds = new Set(groups.map(g => g.id));
        const groupsRes = await fetch(`${GROUP_API_BASE}/my-groups`, { headers: getAuthHeaders() });
        if (groupsRes.ok) {
          const newGroups = await groupsRes.json();
          setGroups(newGroups);
          const newGroup = newGroups.find((g: any) => !oldGroupIds.has(g.id));
          if (newGroup && socket) {
            // Lấy tên user từ danh sách thành viên của nhóm mới
            let myName = "Một thành viên mới";
            try {
              const memRes = await fetch(`${GROUP_API_BASE}/${newGroup.id}/members`, { headers: getAuthHeaders() });
              if (memRes.ok) {
                const memData = await memRes.json();
                const myInfo = memData.find((m: any) => String(m.id) === myUserId);
                if (myInfo?.fullName) myName = myInfo.fullName;
              }
            } catch (e) {}

            socket.emit("join_room", String(newGroup.id));
            socket.emit("send_message", {
              groupId: String(newGroup.id),
              content: `${myName} đã tham gia nhóm`,
              messageType: "system"
            });
          }
        }
      } else showToast("Mã tham gia không hợp lệ hoặc bạn đã ở trong nhóm!");
    } catch (err) { console.error(err); }
  };

  const handleLeaveGroup = async () => {
    if (isAdmin) { showToast("Nhóm trưởng không thể rời nhóm!"); return; }
    if (!confirm("Bạn có chắc chắn muốn rời khỏi nhóm này?")) return;
    try {
      // Gửi thông báo hệ thống trước khi rời
      const myName = membersMap[myUserId]?.fullName || "Một thành viên";
      if (socket && currentGroup) {
        socket.emit("send_message", {
          groupId: String(currentGroup.id),
          content: `${myName} đã rời khỏi nhóm`,
          messageType: "system"
        });
      }

      const res = await fetch(`${GROUP_API_BASE}/${currentGroup.id}/leave`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        showToast("Đã rời nhóm!");
        setCurrentGroup(null);
        setShowGroupInfo(false);
        fetchMyGroups();
      }
    } catch (err) { console.error(err); }
  };

  const handleKickMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Bạn muốn mời ${memberName} ra khỏi nhóm?`)) return;
    try {
      const res = await fetch(`${GROUP_API_BASE}/${currentGroup.id}/members/${memberId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        // Gửi thông báo hệ thống sau khi đuổi thành viên
        if (socket && currentGroup) {
          socket.emit("send_message", {
            groupId: String(currentGroup.id),
            content: `${memberName} đã bị mời khỏi nhóm`,
            messageType: "system"
          });
        }
        showToast("Đã mời thành viên ra khỏi nhóm!");
        selectGroup(currentGroup);
      }
    } catch (err) { console.error(err); }
  };

  const handleDeleteGroup = async () => {
    if (!confirm("CẢNH BÁO: Bạn có chắc chắn muốn giải tán nhóm này? Hành động không thể hoàn tác!")) return;
    try {
      const res = await fetch(`${GROUP_API_BASE}/${currentGroup.id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        showToast("Đã giải tán nhóm!");
        setCurrentGroup(null);
        setShowGroupInfo(false);
        fetchMyGroups();
      }
    } catch (err) { console.error(err); }
  };

  const sendMessage = () => {
    if (!inputText.trim() || !currentGroup || !socket) return;
    socket.emit("send_message", { groupId: String(currentGroup.id), content: inputText });
    setInputText("");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentGroup || !socket) return;
    e.target.value = "";
    if (file.size > 20 * 1024 * 1024) { showToast("File quá lớn! Tối đa 20MB."); return; }
    
    const isImage = file.type.startsWith("image/");
    const msgType = isImage ? "image" : "file";
    setIsUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(`${NODE_SERVER}/api/upload`, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || "Upload thất bại!"); return; }
      if (data.fileUrl) {
        socket.emit("send_message", {
          groupId: String(currentGroup.id),
          content: isImage ? "Đã gửi một ảnh" : data.fileName,
          messageType: msgType, fileUrl: data.fileUrl, fileName: data.fileName,
        });
      }
    } catch (error) { showToast("Lỗi kết nối khi upload!"); } 
    finally { setIsUploading(false); }
  };

  const forceDownload = async (url: string, fileName: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl; a.download = fileName || "download";
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) { window.open(url, "_blank"); }
  };

  const deleteMessage = (messageId: string) => {
    if (!confirm("Thu hồi tin nhắn này?")) return;
    if (socket && currentGroup) socket.emit("delete_message", { messageId, groupId: String(currentGroup.id) });
  };

  const openVideoCall = () => {
    if (!currentGroup || !socket) return;
    const groupId = String(currentGroup.id);

    // Thông báo cho cả nhóm (chỉ lần đầu)
    if (activeCall !== groupId) {
      socket.emit("start_call", {
        groupId,
        groupName: currentGroup.groupName,
      });
    }

    // Mở trang call — server tự track qua join_call/leave_call
    window.open(`/call?roomId=${groupId}`, "_blank");
  };

  // ✅ XÁC ĐỊNH CHÍNH XÁC QUYỀN ADMIN DỰA VÀO TRƯỜNG "createdBy"
  const isAdmin = groupDetails && (String(groupDetails.createdBy) === myUserId);

  return (
    <div className="flex h-screen w-full bg-[#f0f2f5] p-4 gap-4 overflow-hidden text-sm">
      <ChatSidebar
        groups={groups}
        currentGroupId={currentGroup?.id}
        onSelectGroup={selectGroup}
        onShowJoinModal={() => setShowJoinModal(true)}
        onShowCreateModal={() => setShowCreateModal(true)}
        onBack={() => router.push("/")}
      />

      <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm relative overflow-hidden">
        {currentGroup ? (
          <>
            <ChatHeader
              currentGroup={currentGroup}
              membersCount={membersList.length}
              onShowGroupInfo={() => setShowGroupInfo(true)}
              onVideoCall={openVideoCall}
              isCallActive={activeCall === String(currentGroup?.id)}
            />
            <ChatMessageList
              messages={messages}
              myUserId={myUserId}
              membersMap={membersMap}
              activeMenu={activeMenu}
              menuRef={menuRef}
              messagesEndRef={messagesEndRef}
              onToggleMenu={(id) => setActiveMenu(activeMenu === id ? null : id)}
              onDeleteMessage={deleteMessage}
              onDownload={forceDownload}
            />
            <ChatInput
              inputText={inputText}
              isUploading={isUploading}
              fileInputRef={fileInputRef}
              onInputChange={setInputText}
              onSend={sendMessage}
              onFileUpload={handleFileUpload}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 font-medium text-base bg-white relative">
            Hãy chọn một nhóm để bắt đầu chat
          </div>
        )}
      </div>

      <CreateGroupModal
        show={showCreateModal}
        groupName={newGroupName}
        groupDesc={newGroupDesc}
        onGroupNameChange={setNewGroupName}
        onGroupDescChange={setNewGroupDesc}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateGroup}
      />
      <JoinGroupModal
        show={showJoinModal}
        joinCode={joinCode}
        onJoinCodeChange={setJoinCode}
        onClose={() => setShowJoinModal(false)}
        onJoin={handleJoinGroup}
      />
      <GroupInfoModal
        show={showGroupInfo}
        currentGroup={currentGroup}
        groupDetails={groupDetails}
        membersList={membersList}
        myUserId={myUserId}
        isAdmin={isAdmin}
        onClose={() => setShowGroupInfo(false)}
        onLeaveGroup={handleLeaveGroup}
        onDeleteGroup={handleDeleteGroup}
        onKickMember={handleKickMember}
        onShowToast={showToast}
      />

      {incomingCall && (
        <div className="fixed top-6 right-6 z-50 bg-white border border-gray-200 rounded-2xl shadow-2xl p-5 w-80 animate-bounce">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <div className="font-bold text-gray-900">Cuộc gọi video</div>
              <div className="text-sm text-gray-500">Nhóm {incomingCall.groupName} đang có cuộc gọi</div>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setIncomingCall(null)}
              className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition"
            >
              Từ chối
            </button>
            <button
              onClick={() => {
                window.open(`/call?roomId=${incomingCall.groupId}`, "_blank");
                setIncomingCall(null);
              }}
              className="flex-1 px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition"
            >
              Tham gia
            </button>
          </div>
        </div>
      )}
      {toast && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-gray-900/80 text-white px-8 py-4 rounded-2xl shadow-2xl text-sm font-semibold pointer-events-auto animate-fade-in">
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}