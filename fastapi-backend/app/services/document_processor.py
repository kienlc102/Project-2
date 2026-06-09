import io
import hashlib
import fitz  # PyMuPDF dùng để đọc PDF siêu tốc
from PIL import Image
import pytesseract
from sentence_transformers import SentenceTransformer
from langchain_text_splitters import RecursiveCharacterTextSplitter

# Load embedding model (384 dimensions)
embedding_model = SentenceTransformer('all-MiniLM-L6-v2')

def calculate_hash(file_bytes: bytes) -> str:
    """Tạo mã băm SHA-256 để kiểm tra trùng lặp file ở mức độ byte."""
    return hashlib.sha256(file_bytes).hexdigest()

def extract_text(file_bytes: bytes, mime_type: str) -> str:
    """
    Bóc tách text thực tế từ PDF, Hình ảnh (OCR), hoặc Text thuần.
    """
    text = ""
    try:
        # 1. Xử lý file PDF
        if "pdf" in mime_type.lower():
            # Mở file PDF từ bytes stream
            pdf_document = fitz.open(stream=file_bytes, filetype="pdf")
            for page_num in range(len(pdf_document)):
                page = pdf_document[page_num]
                text += page.get_text()
                
        # 2. Xử lý file Hình ảnh (Cần OCR)
        elif "image" in mime_type.lower():
            image = Image.open(io.BytesIO(file_bytes))
            # Sử dụng Tesseract với tiếng Việt (vie) và tiếng Anh (eng)
            text = pytesseract.image_to_string(image, lang='vie+eng')
            
        # 3. Xử lý file Text thuần (.txt, .csv)
        elif "text" in mime_type.lower():
            text = file_bytes.decode('utf-8')
            
        else:
            raise ValueError(f"Định dạng {mime_type} chưa được hỗ trợ trích xuất văn bản.")
            
    except Exception as e:
        raise RuntimeError(f"Lỗi khi trích xuất văn bản: {str(e)}")
    
    return text.strip()

import re

def clean_ocr_text(text: str) -> str:
    """
    Cleans noisy OCR text to prevent LLM context breaking.
    """
    if not text:
        return text
    # 1. Fix broken words at the end of lines (e.g., "word-\n")
    text = re.sub(r'(\w+)-\n(\w+)', r'\1\2', text)
    
    # 2. Remove arbitrary single line breaks within sentences (keep double \n\n)
    text = re.sub(r'(?<!\n)\n(?!\n)', ' ', text)
    
    # 3. Remove repeating page numbers (e.g., "Page 12", "Trang 5")
    text = re.sub(r'(?i)\b(Page|Trang)\s*\d+\b', '', text)
    
    # 4. Collapse multiple spaces into one
    text = re.sub(r' +', ' ', text)
    
    return text.strip()

def chunk_document(text: str, chunk_size: int = 500, chunk_overlap: int = 50) -> list[str]:
    """
    Chia nhỏ văn bản thông minh bằng LangChain.
    - chunk_size: Ký tự tối đa mỗi đoạn.
    - chunk_overlap: Số ký tự chồng lấp giữa 2 đoạn để không bị mất ngữ cảnh (context).
    """
    if not text:
        return []
    
    # RecursiveCharacterTextSplitter cố gắng cắt theo đoạn văn (\n\n), rồi đến câu, rồi đến từ
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        length_function=len,
    )
    
    chunks = text_splitter.split_text(text)
    return chunks

def generate_embedding(text: str) -> list[float]:
    """Biến đổi text thành vector 384 chiều."""
    return embedding_model.encode(text).tolist()