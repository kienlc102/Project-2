package com.project2.group.integration.user;

import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class MockUserIntegrationImpl implements UserIntegrationService {

    @Override
    public UserDto getUserById(String userId) {
        return UserDto.builder()
                .id(userId)
                .fullName("User " + userId)
                .avatarUrl("https://ui-avatars.com/api/?name=User+" + userId)
                .email("user" + userId + "@fake.com")
                .build();
    }

    @Override
    public List<UserDto> getUsersByIds(List<String> userIds) {
        return userIds.stream()
                .map(this::getUserById)
                .collect(Collectors.toList());
    }
}