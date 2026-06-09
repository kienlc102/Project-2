"use client";

import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { uploadDocument, getUniversities, getSubjects } from "@/lib/documents";
import { getProfile, getToken } from "@/lib/auth";
import Link from "next/link";
import { ArrowLeft, Upload, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

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

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden py-12 px-4 flex items-center justify-center">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-fuchsia-600/20 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-2xl flex flex-col gap-6 relative z-10">
        <Link
          href="/document"
          className="w-max inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-md transition hover:bg-slate-100 hover:text-slate-900 backdrop-blur-md"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Quay lại</span>
        </Link>

        <div className="bg-white backdrop-blur-xl border border-slate-200 rounded-3xl shadow-2xl p-8 transition-all hover:bg-slate-50">
          <h1 className="text-3xl font-bold text-center mb-8 text-slate-900">Tải Lên Tài Liệu</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Vùng chọn file */}
            <label className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-white/20 rounded-2xl bg-white0 cursor-pointer transition-all duration-300 hover:border-indigo-500/50 hover:bg-indigo-500/5 group shadow-inner">
              <Upload className="w-12 h-12 text-slate-500 mb-4 group-hover:text-indigo-600 transition-colors" />
              <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-700 transition-colors">
                {file ? file.name : "Nhấp để chọn file (PDF, Docx...)"}
              </span>
              <input
                type="file"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Người tải lên</label>
                <input
                  className="w-full px-4 py-3 bg-white0 border border-slate-200 text-slate-500 rounded-xl cursor-not-allowed shadow-inner"
                  type="text"
                  readOnly
                  value={currentUserEmail || "Chưa đăng nhập"}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Group ID</label>
                <input
                  className="w-full px-4 py-3 bg-white border border-slate-200 text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder-slate-600 shadow-inner"
                  name="group_id"
                  type="number"
                  placeholder="Bỏ trống nếu không có"
                  value={formData.group_id}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Mã Trường *</label>
                <input
                  className="w-full px-4 py-3 bg-white border border-slate-200 text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder-slate-600 shadow-inner"
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
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Mã Môn Học *</label>
                <input
                  className="w-full px-4 py-3 bg-white border border-slate-200 text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder-slate-600 shadow-inner"
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                  {selectedSubject ? "Tên Môn Học (Đã Tồn Tại)" : "Tên Môn Học Mới *"}
                </label>
                <input
                  className={`w-full px-4 py-3 border border-slate-200 text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-inner ${selectedSubject ? 'bg-emerald-50 border-emerald-300' : 'bg-white placeholder-slate-600'}`}
                  name="subject_name"
                  required={!selectedSubject}
                  value={formData.subject_name}
                  onChange={handleInputChange}
                  readOnly={!!selectedSubject}
                  placeholder={selectedSubject ? "Môn học đã tồn tại" : "Nhập tên môn học mới"}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Loại Tài Liệu *</label>
                <select
                  className="w-full px-4 py-3 bg-white border border-slate-200 text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-inner appearance-none"
                  name="doc_type"
                  required
                  value={formData.doc_type}
                  onChange={handleInputChange}
                >
                  <option value="lecture" className="bg-white">Bài giảng (Lecture)</option>
                  <option value="exercise" className="bg-white">Bài tập (Exercise)</option>
                  <option value="exam" className="bg-white">Đề thi (Exam)</option>
                  <option value="other" className="bg-white">Khác (Other)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition duration-300 shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] mt-4 flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Upload Tài Liệu
                </>
              )}
            </button>
          </form>

          {/* Alerts */}
          {error && (
            <div className="mt-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-rose-600 font-semibold mb-1">Lỗi Upload</strong>
                <p className="text-rose-300/80 text-sm">{error}</p>
              </div>
            </div>
          )}

          {result && (
            <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-emerald-600 font-semibold mb-1">Thành công!</strong>
                <p className="text-emerald-700/80 text-sm mb-2">{result.message}</p>
                <div className="inline-flex px-3 py-1 bg-emerald-500/20 text-emerald-700 rounded-lg text-xs font-mono">
                  Mã tài liệu: #{result.document_id}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}