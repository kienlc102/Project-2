package com.project2.group.modules.group.service;

import com.project2.group.integration.user.UserDto;
import com.project2.group.modules.group.entity.StudyGroup;
import java.util.List;

public interface GroupService {
    StudyGroup createGroup(String groupName, String description, String creatorId);

    void joinGroup(String inviteCode, String userId);

    List<UserDto> getGroupMembers(Long groupId, String userId);

    List<StudyGroup> getMyGroups(String userId);

    StudyGroup getGroupDetails(Long groupId, String userId);

    StudyGroup updateGroup(Long groupId, String groupName, String description, String userId);

    void deleteGroup(Long groupId, String userId);

    void leaveGroup(Long groupId, String userId);

    void kickMember(Long groupId, String memberId, String requesterId);
}