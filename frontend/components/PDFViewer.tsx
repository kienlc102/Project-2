'use client';

import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Loader2, FileText } from 'lucide-react';

// Cấu hình Worker sử dụng .mjs cho các phiên bản pdfjs mới
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// Import CSS
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

interface PDFViewerProps {
  docId: string;
  onDownload: () => void;
}

export default function PDFViewer({ docId, onDownload }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pdfError, setPdfError] = useState(false);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPdfError(false);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('PDF load error:', error);
    setPdfError(true);
  };

  if (pdfError) {
    return (
      <div className="flex items-center justify-center h-96 bg-red-50 border border-red-200 rounded-lg">
        <div className="text-center">
          <FileText className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-sm text-red-600 mb-4">Không thể tải nội dung PDF</p>
          <button
            onClick={onDownload}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
          >
            Tải tài liệu trực tiếp
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden flex flex-col items-center bg-gray-200 py-4">
      <Document
        file={`http://localhost:8000/api/v1/document/download/${docId}`}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={onDocumentLoadError}
        loading={
          <div className="flex items-center justify-center h-96 w-[750px] bg-white">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Đang render trang PDF...</p>
            </div>
          </div>
        }
      >
        <Page
          pageNumber={pageNumber}
          width={750}
          renderTextLayer={false}
          renderAnnotationLayer={false}
          className="shadow-lg bg-white"
        />
      </Document>

      {/* Paginator */}
      {numPages && numPages > 0 && (
        <div className="mt-4 px-4 py-2 bg-white rounded-full shadow flex items-center gap-4">
          <button
            onClick={() => setPageNumber((prev) => Math.max(1, prev - 1))}
            disabled={pageNumber <= 1}
            className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
          >
            Trang trước
          </button>
          <span className="text-sm font-medium text-gray-700">
            {pageNumber} / {numPages}
          </span>
          <button
            onClick={() => setPageNumber((prev) => Math.min(numPages, prev + 1))}
            disabled={pageNumber >= numPages}
            className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
          >
            Trang sau
          </button>
        </div>
      )}
    </div>
  );
}