package com.project2.group.exception; // Lưu ý: Đổi tên package cho khớp với project của bạn nếu cần

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // 1. Chuyên tóm gọn các lỗi ResponseStatusException (như lỗi 400, 403, 404 bạn
    // vừa ném ra)
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleResponseStatusException(ResponseStatusException ex) {
        return ResponseEntity.status(ex.getStatusCode())
                .body(Map.of(
                        "success", false,
                        "message", ex.getReason() != null ? ex.getReason() : "Đã xảy ra lỗi hệ thống"));
    }

    // 2. Chuyên tóm gọn các lỗi RuntimeException (như cái lỗi "User already in
    // group" ở hàm Join)
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntimeException(RuntimeException ex) {
        return ResponseEntity.status(400) // Mặc định trả về 400 Bad Request
                .body(Map.of(
                        "success", false,
                        "message", ex.getMessage() != null ? ex.getMessage() : "Yêu cầu không hợp lệ"));
    }
}