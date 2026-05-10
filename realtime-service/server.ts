import express, { Request, Response } from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';

import Message from './models/Message';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
const server = http.createServer(app);

const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

// ==========================================
// 1. KẾT NỐI MONGODB
// ==========================================
mongoose.connect(process.env.MONGO_URI as string)
    .then(() => console.log("🗄️ Kết nối MongoDB thành công!"))
    .catch(err => console.error("❌ Lỗi kết nối MongoDB:", err));

// ==========================================
// 2. CẤU HÌNH CLOUDINARY & MULTER
// ==========================================
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// ✅ Các loại file được phép upload
const ALLOWED_MIME_TYPES = [
    // Ảnh
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    // Video
    'video/mp4', 'video/webm',
    // Tài liệu
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',       // .xlsx
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
    // Nén
    'application/zip',
    'application/x-rar-compressed',
    // Text
    'text/plain',
];

// ✅ Giới hạn 20MB, lọc loại file
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 20 * 1024 * 1024 // 20MB
    },
    fileFilter: (req, file, cb) => {
        if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`Loại file không được phép: ${file.mimetype}`));
        }
    }
});

// ==========================================
// 3. CÁC API REST
// ==========================================
app.get('/api/messages/:groupId', async (req: Request, res: Response) => {
    try {
        const messages = await Message.find({ groupId: req.params.groupId }).sort({ createdAt: 1 }).limit(50);
        res.json(messages);
    } catch (err) {
        res.status(500).json({ error: "Lỗi lấy lịch sử chat" });
    }
});

// ✅ Xử lý lỗi multer (file quá lớn, sai loại) trả về JSON rõ ràng
app.post('/api/upload', (req: Request, res: Response, next: Function) => {
    upload.single('file')(req, res, (err: any) => {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ error: "File quá lớn! Giới hạn tối đa là 20MB." });
            }
            return res.status(400).json({ error: `Lỗi upload: ${err.message}` });
        } else if (err) {
            return res.status(400).json({ error: err.message });
        }
        next();
    });
}, (req: Request, res: Response): any => {
    try {
        if (!req.file) return res.status(400).json({ error: "Chưa chọn file!" });

        const isMedia = req.file.mimetype.startsWith("image/") || req.file.mimetype.startsWith("video/");
        const resType = isMedia ? "auto" : "raw";
        const originalName = req.file.originalname;

        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: "chat_uploads",
                resource_type: resType as any,
                use_filename: true,
                unique_filename: true,
            },
            (error, result) => {
                if (error) {
                    console.error("Lỗi upload Cloudinary:", error);
                    return res.status(500).json({ error: "Lỗi khi đẩy lên Cloud" });
                }
                res.json({
                    fileUrl: result?.secure_url,
                    fileName: originalName
                });
            }
        );

        uploadStream.end(req.file.buffer);

    } catch (error) {
        console.error("Lỗi xử lý file:", error);
        res.status(500).json({ error: "Lỗi Server" });
    }
});

// ✅ API xóa tin nhắn — chỉ xóa DB, file Cloudinary giữ nguyên
app.delete('/api/messages/:messageId', async (req: Request, res: Response): Promise<any> => {
    try {
        const { messageId } = req.params;
        const { senderId } = req.body;

        const message = await Message.findById(messageId);
        if (!message) return res.status(404).json({ error: "Không tìm thấy tin nhắn" });

        if (message.senderId !== senderId) {
            return res.status(403).json({ error: "Không có quyền xóa tin nhắn này" });
        }

        await Message.findByIdAndDelete(messageId);
        res.json({ success: true, messageId });
    } catch (err) {
        console.error("Lỗi xóa tin nhắn:", err);
        res.status(500).json({ error: "Lỗi xóa tin nhắn" });
    }
});

// ==========================================
// 4. BẢO MẬT JWT & SOCKET.IO
// ==========================================
interface JwtPayload { userId?: string; sub?: string; [key: string]: any; }
interface CustomSocket extends Socket { user?: JwtPayload; }

io.use((socket: CustomSocket, next) => {
    try {
        let token = socket.handshake.auth?.token as string;
        if (token && token.startsWith('Bearer ')) token = token.slice(7);
        if (!token) return next(new Error("Không tìm thấy Token!"));

        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
        socket.user = decoded;
        next();
    } catch (err) {
        return next(new Error("Token không hợp lệ!"));
    }
});

// Theo dõi số người đang trong cuộc gọi theo từng nhóm
const activeCalls = new Map<string, Set<string>>();

io.on("connection", (socket: CustomSocket) => {
    const userId = socket.user?.userId || socket.user?.sub || "Unknown";
    console.log(`🟢 User [${userId}] vừa kết nối!`);

    socket.on("join_room", (groupId: string) => {
        socket.join(groupId);
        // Nếu nhóm này đang có cuộc gọi → báo cho user vừa vào
        const callSet = activeCalls.get(groupId);
        if (callSet && callSet.size > 0) {
            socket.emit("call_status", {
                groupId,
                count: callSet.size,
            });
        }
        console.log(`User [${userId}] vào phòng: ${groupId}`);
    });

    socket.on("leave_room", (groupId: string) => {
        socket.leave(groupId);
        console.log(`User [${userId}] rời phòng: ${groupId}`);
    });

    socket.on("send_message", async (data: {
        groupId: string;
        content: string;
        messageType?: string;
        fileUrl?: string;
        fileName?: string;
    }) => {
        try {
            const newMessage = new Message({
                groupId: data.groupId,
                senderId: userId,
                content: data.content || "",
                messageType: data.messageType || 'text',
                fileUrl: data.fileUrl || "",
                fileName: data.fileName || ""
            });
            const savedMessage = await newMessage.save();
            io.to(data.groupId).emit("receive_message", savedMessage);
            console.log("✅ Đã lưu và phát tin nhắn thành công!");
        } catch (err) {
            console.error("Lỗi lưu tin nhắn:", err);
        }
    });

    // ✅ Socket event xóa tin nhắn — broadcast toàn room
    socket.on("delete_message", async (data: { messageId: string; groupId: string }) => {
        try {
            const message = await Message.findById(data.messageId);
            if (!message) return;

            // Chỉ người gửi mới được xóa
            if (String(message.senderId) !== String(userId)) {
                socket.emit("delete_error", { error: "Không có quyền xóa tin nhắn này" });
                return;
            }

            await Message.findByIdAndDelete(data.messageId);

            // Thông báo toàn bộ room xóa tin nhắn khỏi UI
            io.to(data.groupId).emit("message_deleted", { messageId: data.messageId });
            console.log(`🗑️ Đã xóa tin nhắn [${data.messageId}] bởi User [${userId}]`);
        } catch (err) {
            console.error("Lỗi xóa tin nhắn:", err);
        }
    });

    // ==========================================
    // 5. SỰ KIỆN GỌI VIDEO — Server-side tracking
    // ==========================================
    socket.on("start_call", (data: { groupId: string; groupName: string }) => {
        socket.to(data.groupId).emit("incoming_call", {
            groupId: data.groupId,
            groupName: data.groupName,
        });
        console.log(`📞 User [${userId}] bắt đầu gọi trong nhóm [${data.groupId}]`);
    });

    socket.on("join_call", (data: { groupId: string }) => {
        if (!activeCalls.has(data.groupId)) activeCalls.set(data.groupId, new Set());
        activeCalls.get(data.groupId)!.add(userId);
        io.to(data.groupId).emit("call_status", {
            groupId: data.groupId,
            count: activeCalls.get(data.groupId)!.size,
        });
        console.log(`📞 User [${userId}] vào cuộc gọi nhóm [${data.groupId}] (${activeCalls.get(data.groupId)!.size} người)`);
    });

    socket.on("leave_call", (data: { groupId: string }) => {
        const callSet = activeCalls.get(data.groupId);
        if (callSet) {
            callSet.delete(userId);
            if (callSet.size === 0) activeCalls.delete(data.groupId);
        }
        io.to(data.groupId).emit("call_status", {
            groupId: data.groupId,
            count: callSet?.size || 0,
        });
        console.log(`📴 User [${userId}] rời cuộc gọi nhóm [${data.groupId}] (${callSet?.size || 0} người)`);
    });

    socket.on("disconnect", () => {
        // Dọn dẹp user khỏi tất cả cuộc gọi đang tham gia
        activeCalls.forEach((callSet, groupId) => {
            if (callSet.has(userId)) {
                callSet.delete(userId);
                io.to(groupId).emit("call_status", {
                    groupId,
                    count: callSet.size,
                });
                if (callSet.size === 0) activeCalls.delete(groupId);
            }
        });
        console.log(`🔴 User [${userId}] ngắt kết nối.`);
    });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`🚀 Server Node.js chạy tại cổng ${PORT}`));