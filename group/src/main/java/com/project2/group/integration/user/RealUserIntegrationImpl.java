package com.project2.group.integration.user;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Primary // Báo cho Spring Boot biết: Hãy dùng thằng này thay cho file Mock!
public class RealUserIntegrationImpl implements UserIntegrationService {

    @Value("${integration.auth-service.url}")
    private String authServiceUrl;

    // Máy gọi điện thoại
    private final RestTemplate restTemplate = new RestTemplate();

    @Override
    public UserDto getUserById(String userId) {
        try {
            // Gọi API: GET http://localhost:5000/api/auth/user/{id}
            String url = authServiceUrl + "/api/auth/user/" + userId;
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            
            // Bóc tách dữ liệu JSON mà Node.js trả về
            if (response != null && (Boolean) response.get("success")) {
                Map<String, Object> data = (Map<String, Object>) response.get("data");
                
                return UserDto.builder()
                        .id(String.valueOf(data.get("id"))) // Ép kiểu cẩn thận
                        .fullName((String) data.get("fullName"))
                        .email((String) data.get("email"))
                        // Lấy chữ cái đầu làm avatar tự động
                        .avatarUrl("https://ui-avatars.com/api/?name=" + data.get("fullName") + "&background=random")
                        .build();
            }
        } catch (Exception e) {
            System.err.println("Lỗi khi gọi Node.js để lấy user " + userId + ": " + e.getMessage());
        }
        
        // Trả về user vô danh nếu Node.js bị sập hoặc không tìm thấy
        return UserDto.builder()
                .id(userId)
                .fullName("User " + userId)
                .email("unknown@example.com")
                .avatarUrl("https://ui-avatars.com/api/?name=U")
                .build();
    }

    @Override
    public List<UserDto> getUsersByIds(List<String> userIds) {
        // Biến danh sách ID thành danh sách UserDto
        return userIds.stream()
                .map(this::getUserById)
                .collect(Collectors.toList());
    }
}