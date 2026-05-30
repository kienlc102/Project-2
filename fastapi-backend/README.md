# FastAPI Backend

Đây là backend của dự án sử dụng FastAPI để xây dựng API cho ứng dụng quản lý tài liệu.

## Cài đặt

### Yêu cầu hệ thống
- Python 3.8 hoặc cao hơn
- PostgreSQL database
- Tesseract OCR (phiên bản 5.5.0.20241111)

### Các bước cài đặt

1. **Tạo virtual environment:**
   ```bash
   python -m venv venv
   ```

2. **Kích hoạt virtual environment:**
   - Trên Windows:
     ```bash
     venv\Scripts\activate
     ```
   - Trên macOS/Linux:
     ```bash
     source venv/bin/activate
     ```

3. **Cài đặt dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Cài đặt Uvicorn (nếu chưa có):**
   ```bash
   pip install uvicorn
   ```

4.5. **Cài đặt Tesseract OCR:**
   - Tải file cài đặt `tesseract-ocr-w64-setup-5.5.0.20241111.exe` từ trang GitHub chính thức: [UB-Mannheim/tesseract](https://github.com/UB-Mannheim/tesseract/wiki)
   - Chạy file cài đặt và làm theo hướng dẫn để cài đặt Tesseract OCR trên hệ thống của bạn.

5. **Thiết lập database:**
   - Tạo một database PostgreSQL mới
   - Chạy schema từ file `../project-2-schemas.sql` để tạo các bảng cần thiết

6. **Tạo file .env:**
   Tạo file `.env` trong thư mục `fastapi-backend` với nội dung:
   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/database_name
   ```
   Thay thế `username`, `password`, và `database_name` bằng thông tin thực tế của bạn.

## Chạy ứng dụng

Sau khi hoàn thành cài đặt, chạy lệnh sau:

```bash
python run.py
```

Ứng dụng sẽ chạy trên `http://127.0.0.1:8000`.

### API Documentation

Khi ứng dụng đang chạy, bạn có thể truy cập tài liệu API tại:
- Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`

## Cấu trúc dự án

- `app/`: Chứa mã nguồn chính của ứng dụng
  - `main.py`: Điểm vào của ứng dụng FastAPI
  - `api/`: Các router và endpoints
  - `core/`: Cấu hình và settings
  - `db/`: Kết nối database
  - `models/`: Mô hình dữ liệu SQLAlchemy
  - `schemas/`: Pydantic schemas
  - `services/`: Logic xử lý nghiệp vụ
- `uploads/`: Thư mục lưu trữ file upload
- `requirements.txt`: Danh sách dependencies Python

## Lưu ý

- Đảm bảo database PostgreSQL đang chạy trước khi khởi động ứng dụng.
- Nếu gặp lỗi kết nối database, kiểm tra lại file `.env` và thông tin database.