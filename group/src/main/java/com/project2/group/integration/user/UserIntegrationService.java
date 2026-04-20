package com.project2.group.integration.user;

import java.util.List;

public interface UserIntegrationService {
    
    UserDto getUserById(String userId);

    List<UserDto> getUsersByIds(List<String> userIds);
}