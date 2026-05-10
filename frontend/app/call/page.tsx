'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getToken } from '@/lib/auth';

const GROUP_API_BASE = "http://localhost:8080/api/groups";
const NODE_SERVER = "http://localhost:5001";

export default function CallPage() {
    const searchParams = useSearchParams();
    const roomId = searchParams.get('roomId') || "TestRoom";
    const containerRef = useRef<HTMLDivElement>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!containerRef.current) return;
        let callSocket: any = null;
        let isMounted = true;
        //let zp: any = null;

        const myMeeting = async (element: HTMLDivElement) => {
            // 1. Kiểm tra đăng nhập
            const token = getToken();
            if (!token) {
                setError("Vui lòng đăng nhập để tham gia cuộc gọi!");
                return;
            }
            
            // 2. Lấy userId từ JWT
            let userId = "";
            try {
                const payload = JSON.parse(atob(token.split(".")[1] || ""));
                userId = String(payload.userId || payload.sub);
            } catch (e) {
                setError("Token không hợp lệ!");
                return;
            }
            if (!isMounted) return;

            // 3. Kiểm tra quyền thành viên + lấy tên hiển thị
            let userName = "User_" + userId;
            try {
                const headers = {
                    "Authorization": `Bearer ${token}`,
                    "X-User-Id": userId,
                    "Content-Type": "application/json",
                };
                const memRes = await fetch(`${GROUP_API_BASE}/${roomId}/members`, { headers });
                if (!memRes.ok) {
                    setError("Bạn không phải thành viên của nhóm này!");
                    return;
                }
                const members = await memRes.json();
                const myInfo = members.find((m: any) => String(m.id) === userId);
                if (myInfo?.fullName) userName = myInfo.fullName;
            } catch (e) {
                setError("Không thể xác thực quyền truy cập!");
                return;
            }
            if (!isMounted) return;
            // 4. Kết nối socket để báo server mình đang trong cuộc gọi
            const { io } = await import("socket.io-client");
            callSocket = io(NODE_SERVER, { auth: { token } });
            callSocket.emit("join_room", roomId);
            callSocket.emit("join_call", { groupId: roomId });
            if (!isMounted) return;
            // 5. Khởi tạo ZegoCloud và join room
            const { ZegoUIKitPrebuilt } = await import('@zegocloud/zego-uikit-prebuilt');
            //const { ZegoSuperBoardManager } = await import('zego-superboard-web');

            const appID = 1277930516;
            const serverSecret = "9d4c6560827dc3263651a8383ad949ca";

            const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(appID, serverSecret, roomId, userId, userName);
            const zp = ZegoUIKitPrebuilt.create(kitToken);
            //zp.addPlugins({ ZegoSuperBoardManager });
            zp.joinRoom({
                container: element,
                scenario: {
                    mode: ZegoUIKitPrebuilt.VideoConference,
                },
                turnOnMicrophoneWhenJoining: false,
                turnOnCameraWhenJoining: false,
                showScreenSharingButton: true,
                showPreJoinView: false,
                showLeavingView: false,
                onLeaveRoom: () => {
                    callSocket?.emit("leave_call", { groupId: roomId });
                    callSocket?.close();
                    window.close();
                },
            });
        };

        myMeeting(containerRef.current);

        // Cleanup khi đóng tab đột ngột
        return () => {
            isMounted = false;
            if (callSocket) {
                callSocket.emit("leave_call", { groupId: roomId });
                callSocket.close();
            }
            // if (zp) {
            //     zp.destroy();
            // }
        };
    }, [roomId]);

    if (error) {
        return (
            <div className="w-screen h-screen bg-gray-900 flex items-center justify-center">
                <div className="bg-white rounded-2xl p-8 max-w-sm text-center shadow-xl">
                    <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div className="text-lg font-bold text-gray-900 mb-2">Không thể tham gia</div>
                    <div className="text-gray-500 text-sm mb-5">{error}</div>
                    <button
                        onClick={() => window.close()}
                        className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-screen h-screen bg-black">
            <div ref={containerRef} className="w-full h-full" />
        </div>
    );
}