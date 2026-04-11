"use client";

import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { uploadDocument, getUniversities, getSubjects } from "@/lib/documents";
import { getProfile, getToken } from "@/lib/auth";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

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
    group_id: "",
    university_code: "HUST",
    subject_code: "IT3140",
    subject_name: "Hệ điều hành",
    doc_type: "lecture",
  });
  const [ownerId, setOwnerId] = useState<string>("");
  const [currentUserEmail, setCurrentUserEmail] = useState<string>("");
  const [universities, setUniversities] = useState<Array<{ id: number; university_code: string; university_name: string }>>([]);
  const [subjects, setSubjects] = useState<Array<{ id: number; subject_code: string; subject_name: string; university_id: number }>>([]);
  const [selectedUniversityId, setSelectedUniversityId] = useState<number | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<{
    id: number;
    subject_code: string;
    subject_name: string;
    university_id: number;
  } | null>(null);

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

  const loadUniversities = async () => {
    try {
      const data = await getUniversities();
      setUniversities(data);
    } catch (err) {
      console.error('Không tải được danh sách trường:', err);
    }
  };

  const loadSubjects = async (universityId: number) => {
    try {
      const data = await getSubjects(universityId);
      setSubjects(data);
    } catch (err) {
      console.error('Không tải được danh sách môn học:', err);
      setSubjects([]);
    }
  };

  useEffect(() => {
    const loadProfile = async () => {
      const token = getToken();
      if (!token) {
        setError("Vui lòng đăng nhập để upload tài liệu.");
        return;
      }

      try {
        const profileResponse = await getProfile(token);
        if (profileResponse?.data?.id) {
          setOwnerId(profileResponse.data.id.toString());
          setCurrentUserEmail(profileResponse.data.email || "");
        } else {
          console.error("Không tìm thấy thông tin người dùng trong phản hồi:", profileResponse);
          setError("Không tải được thông tin người dùng. Vui lòng đăng nhập lại.");
        }
      } catch (fetchError) {
        console.error("Lỗi khi lấy thông tin profile:", fetchError);
        setError("Không thể lấy thông tin profile người dùng.");
      }
    };

    loadUniversities();
    loadProfile();
  }, []);

  useEffect(() => {
    const match = universities.find(
      (uni) => uni.university_code.toLowerCase() === formData.university_code.trim().toLowerCase()
    );

    if (match) {
      setSelectedUniversityId(match.id);
    } else {
      setSelectedUniversityId(null);
      setSubjects([]);
      setSelectedSubject(null);
    }
  }, [formData.university_code, universities]);

  useEffect(() => {
    if (selectedUniversityId !== null) {
      loadSubjects(selectedUniversityId);
    }
  }, [selectedUniversityId]);

  useEffect(() => {
    if (!formData.subject_code) {
      setSelectedSubject(null);
      return;
    }

    const match = subjects.find(
      (subject) => subject.subject_code.toLowerCase() === formData.subject_code.trim().toLowerCase()
    );

    if (match) {
      setSelectedSubject(match);
      setFormData((prev) => ({ ...prev, subject_name: match.subject_name }));
    } else {
      setSelectedSubject(null);
    }
  }, [formData.subject_code, subjects]);

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

    if (!ownerId) {
      setError("Vui lòng đăng nhập để upload tài liệu.");
      return;
    }

    if (!selectedSubject && !formData.subject_name.trim()) {
      setError("Vui lòng nhập tên môn học mới khi mã môn học chưa tồn tại.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const data = new FormData();
    data.append("file", file);
    data.append("owner_id", ownerId);
    data.append("university_code", formData.university_code);
    data.append("subject_code", formData.subject_code);
    data.append("subject_name", formData.subject_name);
    data.append("doc_type", formData.doc_type);
    if (formData.group_id) data.append("group_id", formData.group_id);

    try {
      const response = await uploadDocument(data);

      if (!response.ok) {
        throw new Error(response.data.detail || "Đã xảy ra lỗi khi upload");
      }

      setResult(response.data);
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
    .upload-layout {
      display: flex;
      flex-direction: column;
      gap: 16px;
      position: relative;
      width: 100%;
      max-width: 600px;
    }
    .upload-back-button {
      position: absolute;
      right: 100%;
      margin-right: 20px;
      top: 0;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 500;
      color: #4b5563;
      text-decoration: none;
      padding: 8px 16px;
      background-color: #ffffff;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      transition: all 0.2s ease-in-out;
    }
    .upload-back-button:hover {
      color: #1d4ed8;
      border-color: #a5b4fc;
      background-color: #eff6ff;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
    }
    /* Responsive: Trên màn hình nhỏ, xếp nút lên trên form */
    @media (max-width: 960px) {
      .upload-layout {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .upload-back-button {
        position: static;
        width: fit-content;
        margin-right: 0;
      }
    }
    .upload-container {
      width: 100%;
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

      <div className="upload-layout" >
        <Link href="/document" className="upload-back-button" style={{width: 120}}>
          <ArrowLeft size={16} />
          <span>Quay lại</span>
        </Link>

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
                <label className="upload-label">Người tải lên</label>
                <input
                  className="upload-input"
                  type="text"
                  readOnly
                  value={currentUserEmail || "Chưa đăng nhập"}
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
                  list="university-list"
                  required
                  value={formData.university_code}
                  onChange={(e) => {
                    handleInputChange(e);
                    const inputValue = e.target.value;
                    const match = universities.find(
                      (uni) => uni.university_code.toLowerCase() === inputValue.trim().toLowerCase()
                    );
                    if (match) {
                      setSelectedUniversityId(match.id);
                    } else {
                      setSelectedUniversityId(null);
                      setSubjects([]);
                      setSelectedSubject(null);
                    }
                  }}
                />
                <datalist id="university-list">
                  {universities.map((uni) => (
                    <option key={uni.id} value={uni.university_code}>
                      {uni.university_name}
                    </option>
                  ))}
                </datalist>
              </div>
              <div className="upload-input-group">
                <label className="upload-label">Subject Code *</label>
                <input
                  className="upload-input"
                  name="subject_code"
                  list="subject-list"
                  required
                  value={formData.subject_code}
                  onChange={(e) => {
                    const inputValue = e.target.value;
                    setFormData((prev) => ({ ...prev, subject_code: inputValue }));
                  }}
                />
                <datalist id="subject-list">
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.subject_code}>
                      {subject.subject_name}
                    </option>
                  ))}
                </datalist>
              </div>
            </div>

            {/* Hàng 3 */}
            <div className="upload-grid">
              <div className="upload-input-group">
                <label className="upload-label">
                  {selectedSubject ? "Subject Name (Môn học đã tồn tại)" : "Subject Name mới *"}
                </label>
                <input
                  className="upload-input"
                  name="subject_name"
                  required={!selectedSubject}
                  value={formData.subject_name}
                  onChange={handleInputChange}
                  readOnly={!!selectedSubject}
                  placeholder={selectedSubject ? "Môn học đã tồn tại" : "Nhập tên môn học mới"}
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
    </div>
  );
}