"use client";

import React, { useState, ChangeEvent, FormEvent } from "react";

// --- INTERFACES ---
interface UploadResponse {
  message: string;
  document_id?: number;
  upload_status: boolean;
  detail?: string;
}

export default function DocumentUploadForm() {
  // --- STATE MANAGEMENT ---
  const [formData, setFormData] = useState({
    owner_id: "1",
    group_id: "",
    university_code: "HUST",
    subject_code: "IT3140",
    subject_name: "Hệ điều hành",
    doc_type: "lecture",
  });

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UploadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // --- HANDLERS ---
  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Vui lòng chọn tệp tin!");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const data = new FormData();
    data.append("file", file);
    data.append("owner_id", formData.owner_id);
    data.append("university_code", formData.university_code);
    data.append("subject_code", formData.subject_code);
    data.append("subject_name", formData.subject_name);
    data.append("doc_type", formData.doc_type);
    if (formData.group_id) data.append("group_id", formData.group_id);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/v1/document/upload", {
        method: "POST",
        body: data,
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.detail || "Đã xảy ra lỗi khi upload");
      }

      setResult(resData);
    } catch (err: any) {
      setError(err.message || "Không thể kết nối đến Server");
    } finally {
      setLoading(false);
    }
  };

  // --- CSS THUẦN (Nhúng trực tiếp) ---
  const rawCSS = `
    .upload-wrapper {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #f3f4f6;
      padding: 20px;
      font-family: system-ui, -apple-system, sans-serif;
    }
    .upload-container {
      width: 100%;
      max-width: 600px;
      background-color: #ffffff;
      padding: 30px;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
      box-sizing: border-box;
    }
    .upload-title {
      margin-top: 0;
      margin-bottom: 24px;
      font-size: 24px;
      color: #111827;
      text-align: center;
    }
    .upload-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .upload-dropzone {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      border: 2px dashed #d1d5db;
      border-radius: 8px;
      background-color: #f9fafb;
      cursor: pointer;
      transition: all 0.2s;
    }
    .upload-dropzone:hover {
      border-color: #3b82f6;
      background-color: #eff6ff;
    }
    .upload-dropzone svg {
      width: 40px;
      height: 40px;
      fill: #9ca3af;
      margin-bottom: 12px;
    }
    .upload-dropzone span {
      font-size: 14px;
      font-weight: 500;
      color: #4b5563;
      text-align: center;
    }
    .upload-hidden-input {
      display: none;
    }
    .upload-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    @media (max-width: 500px) {
      .upload-grid { grid-template-columns: 1fr; }
    }
    .upload-input-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .upload-label {
      font-size: 12px;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .upload-input, .upload-select {
      width: 100%;
      padding: 10px 14px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s;
      box-sizing: border-box;
      color: #111827;
      background-color: #fff;
    }
    .upload-input:focus, .upload-select:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
    .upload-button {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      width: 100%;
      padding: 14px;
      background-color: #2563eb;
      color: #ffffff;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: background-color 0.2s;
      margin-top: 10px;
    }
    .upload-button:hover:not(:disabled) {
      background-color: #1d4ed8;
    }
    .upload-button:disabled {
      background-color: #93c5fd;
      cursor: not-allowed;
    }
    .upload-spinner {
      width: 20px;
      height: 20px;
      border: 3px solid rgba(255,255,255,0.3);
      border-radius: 50%;
      border-top-color: #fff;
      animation: upload-spin 1s ease-in-out infinite;
    }
    @keyframes upload-spin {
      to { transform: rotate(360deg); }
    }
    .upload-alert {
      margin-top: 24px;
      padding: 16px;
      border-radius: 8px;
      font-size: 14px;
      line-height: 1.5;
    }
    .upload-alert strong { display: block; margin-bottom: 4px; font-size: 16px; }
    .upload-alert.error { background-color: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
    .upload-alert.success { background-color: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
  `;

  // --- RENDER ---
  return (
    <div className="upload-wrapper">
      {/* Inject CSS vào DOM */}
      <style dangerouslySetInnerHTML={{ __html: rawCSS }} />

      <div className="upload-container">
        <h1 className="upload-title">Test API Upload</h1>

        <form onSubmit={handleSubmit} className="upload-form">
          {/* Vùng chọn file */}
          <label className="upload-dropzone">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11zM8 15.01l1.41 1.41L11 14.84V19h2v-4.16l1.59 1.59L16 15.01 12.01 11 8 15.01z" />
            </svg>
            <span>{file ? file.name : "Nhấp để chọn file (PDF, Docx...)"}</span>
            <input
              type="file"
              className="upload-hidden-input"
              onChange={handleFileChange}
            />
          </label>

          {/* Hàng 1 */}
          <div className="upload-grid">
            <div className="upload-input-group">
              <label className="upload-label">Owner ID *</label>
              <input
                className="upload-input"
                name="owner_id"
                type="number"
                required
                value={formData.owner_id}
                onChange={handleInputChange}
              />
            </div>
            <div className="upload-input-group">
              <label className="upload-label">Group ID</label>
              <input
                className="upload-input"
                name="group_id"
                type="number"
                placeholder="Bỏ trống nếu không có"
                value={formData.group_id}
                onChange={handleInputChange}
              />
            </div>
          </div>

          {/* Hàng 2 */}
          <div className="upload-grid">
            <div className="upload-input-group">
              <label className="upload-label">University Code *</label>
              <input
                className="upload-input"
                name="university_code"
                required
                value={formData.university_code}
                onChange={handleInputChange}
              />
            </div>
            <div className="upload-input-group">
              <label className="upload-label">Subject Code *</label>
              <input
                className="upload-input"
                name="subject_code"
                required
                value={formData.subject_code}
                onChange={handleInputChange}
              />
            </div>
          </div>

          {/* Hàng 3 */}
          <div className="upload-grid">
            <div className="upload-input-group">
              <label className="upload-label">Subject Name *</label>
              <input
                className="upload-input"
                name="subject_name"
                required
                value={formData.subject_name}
                onChange={handleInputChange}
              />
            </div>
            <div className="upload-input-group">
              <label className="upload-label">Document Type *</label>
              <select
                className="upload-select"
                name="doc_type"
                required
                value={formData.doc_type}
                onChange={handleInputChange}
              >
                <option value="lecture">Lecture (Bài giảng)</option>
                <option value="exercise">Exercise (Bài tập)</option>
                <option value="exam">Exam (Đề thi)</option>
                <option value="other">Other (Khác)</option>
              </select>
            </div>
          </div>

          {/* Nút Submit */}
          <button type="submit" className="upload-button" disabled={loading}>
            {loading ? (
              <>
                <span className="upload-spinner"></span>
                Đang xử lý...
              </>
            ) : (
              "Upload Tài Liệu"
            )}
          </button>
        </form>

        {/* Khu vực hiển thị thông báo lỗi / thành công */}
        {error && (
          <div className="upload-alert error">
            <strong>Lỗi Upload</strong>
            {error}
          </div>
        )}

        {result && (
          <div className="upload-alert success">
            <strong>Thành công!</strong>
            {result.message} <br />
            <span style={{ fontSize: "12px", opacity: 0.8 }}>
              Mã tài liệu (ID): {result.document_id}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}