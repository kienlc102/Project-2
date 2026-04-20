package com.project2.group.modules.group.service;

import com.project2.group.integration.user.UserDto;
import com.project2.group.integration.user.UserIntegrationService;
import com.project2.group.modules.group.entity.GroupMember;
import com.project2.group.modules.group.entity.GroupMemberId;
import com.project2.group.modules.group.entity.StudyGroup;
import com.project2.group.modules.group.repository.GroupMemberRepository;
import com.project2.group.modules.group.repository.GroupRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GroupServiceImpl implements GroupService {

    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final UserIntegrationService userIntegrationService;

    @Override
    @Transactional
    public StudyGroup createGroup(String groupName, String description, String creatorId) {
        StudyGroup group = new StudyGroup();
        group.setGroupName(groupName);
        group.setDescription(description);
        group.setCreatedBy(creatorId);
        group.setInviteCode(UUID.randomUUID().toString().substring(0, 10));
        StudyGroup savedGroup = groupRepository.save(group);

        GroupMemberId memberId = new GroupMemberId(savedGroup.getId(), creatorId);
        GroupMember adminMember = new GroupMember();
        adminMember.setId(memberId);
        adminMember.setStudyGroup(savedGroup);
        adminMember.setRole("admin");
        groupMemberRepository.save(adminMember);

        return savedGroup;
    }

    @Override
    @Transactional
    public void joinGroup(String inviteCode, String userId) {
        StudyGroup group = groupRepository.findByInviteCode(inviteCode)
                .orElseThrow(() -> new RuntimeException("Group not found"));

        boolean alreadyJoined = groupMemberRepository.existsById_GroupIdAndId_UserId(group.getId(), userId);
        if (alreadyJoined) {
            throw new RuntimeException("User already in group");
        }

        GroupMemberId memberId = new GroupMemberId(group.getId(), userId);
        GroupMember newMember = new GroupMember();
        newMember.setId(memberId);
        newMember.setStudyGroup(group);
        newMember.setRole("member");
        groupMemberRepository.save(newMember);
    }

    @Override
    public List<UserDto> getGroupMembers(Long groupId) {
        List<GroupMember> members = groupMemberRepository.findByStudyGroup_Id(groupId);
        List<String> userIds = members.stream()
                .map(member -> member.getId().getUserId())
                .collect(Collectors.toList());
        return userIntegrationService.getUsersByIds(userIds);
    }
}