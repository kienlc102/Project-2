package com.project2.group.modules.group.service;

import com.project2.group.integration.user.UserDto;
import com.project2.group.modules.group.entity.StudyGroup;
import java.util.List;

public interface GroupService {
    StudyGroup createGroup(String groupName, String description, String creatorId);
    void joinGroup(String inviteCode, String userId);
    List<UserDto> getGroupMembers(Long groupId);
}