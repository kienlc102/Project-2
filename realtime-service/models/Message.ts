import mongoose, { Schema, Document } from 'mongoose';

// 1. Định nghĩa kiểu dữ liệu cho TypeScript hiểu
export interface IMessage extends Document {
    groupId: string;
    senderId: string;
    content: string;
    messageType: string; // Phân loại: 'text', 'image', 'file'
    fileUrl: string;     // URL file trên Cloudinary
    fileName: string;    // Tên file gốc (để hiển thị và tải về)
    createdAt: Date;
    updatedAt: Date;
}

// 2. Định nghĩa khuôn mẫu (Schema) cho MongoDB
const MessageSchema: Schema = new Schema({
    groupId: { type: String, required: true },
    senderId: { type: String, required: true },
    content: { type: String, default: "" },
    messageType: { type: String, default: "text" },
    fileUrl: { type: String, default: "" },
    fileName: { type: String, default: "" }
}, {
    timestamps: true //  MongoDB tự động lưu thời gian gửi tin nhắn!
});

export default mongoose.model<IMessage>('Message', MessageSchema);