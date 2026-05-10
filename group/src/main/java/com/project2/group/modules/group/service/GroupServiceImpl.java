package com.project2.group.modules.group.service;

import com.project2.group.integration.user.UserDto;
import com.project2.group.integration.user.UserIntegrationService;
import com.project2.group.modules.group.entity.GroupMember;
import com.project2.group.modules.group.entity.GroupMemberId;
import com.project2.group.modules.group.entity.StudyGroup;
import com.project2.group.modules.group.repository.GroupMemberRepository;
import com.project2.group.modules.group.repository.GroupRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

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
    public List<UserDto> getGroupMembers(Long groupId, String userId) {

        StudyGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy nhóm này"));

        // 2. Kiểm tra xem user có nằm trong nhóm hoặc là người tạo không
        boolean isCreator = group.getCreatedBy().equals(userId);
        boolean isMember = groupMemberRepository.existsById_GroupIdAndId_UserId(groupId, userId);

        // 3. Nếu không phải người tạo và không phải thành viên -> Chặn bằng lỗi 403
        if (!isCreator && !isMember) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Lỗi 403: Bạn không có quyền xem thông tin nhóm này!");
        }

        List<GroupMember> members = groupMemberRepository.findByStudyGroup_Id(groupId);
        List<String> userIds = members.stream()
                .map(member -> member.getId().getUserId())
                .collect(Collectors.toList());

        return userIntegrationService.getUsersByIds(userIds);
    }

    // 1. LẤY DANH SÁCH NHÓM CỦA TÔI
    @Override
    public List<StudyGroup> getMyGroups(String userId) {
        List<GroupMember> members = groupMemberRepository.findById_UserId(userId);
        return members.stream()
                .map(GroupMember::getStudyGroup)
                .collect(Collectors.toList());
    }

    // 2. XEM CHI TIẾT 1 NHÓM
    @Override
    public StudyGroup getGroupDetails(Long groupId, String userId) {
        StudyGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy nhóm"));

        boolean isCreator = group.getCreatedBy().equals(userId);
        boolean isMember = groupMemberRepository.existsById_GroupIdAndId_UserId(groupId, userId);

        if (!isCreator && !isMember) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không có quyền xem nhóm này");
        }
        return group;
    }

    // 3. SỬA THÔNG TIN NHÓM (Chỉ Trưởng nhóm)
    @Override
    @Transactional
    public StudyGroup updateGroup(Long groupId, String groupName, String description, String userId) {
        StudyGroup group = getGroupDetails(groupId, userId); // Tận dụng lại hàm trên để check tồn tại

        if (!group.getCreatedBy().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Chỉ trưởng nhóm mới được sửa thông tin!");
        }

        group.setGroupName(groupName);
        group.setDescription(description);
        return groupRepository.save(group);
    }

    // 4. XÓA/GIẢI TÁN NHÓM (Chỉ Trưởng nhóm)
    @Override
    @Transactional
    public void deleteGroup(Long groupId, String userId) {
        StudyGroup group = getGroupDetails(groupId, userId);

        if (!group.getCreatedBy().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Chỉ trưởng nhóm mới được giải tán nhóm!");
        }

        // Phải xóa hết thành viên trước rồi mới xóa nhóm (để không bị lỗi khóa ngoại -
        // Foreign Key)
        groupMemberRepository.deleteByStudyGroup_Id(groupId);
        groupRepository.delete(group);
    }

    // 5. RỜI NHÓM (Dành cho Thành viên)
    @Override
    @Transactional
    public void leaveGroup(Long groupId, String userId) {
        StudyGroup group = getGroupDetails(groupId, userId);

        if (group.getCreatedBy().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Trưởng nhóm không thể rời nhóm, hãy giải tán nhóm!");
        }

        groupMemberRepository.deleteById_GroupIdAndId_UserId(groupId, userId);
    }

    // 6. ĐUỔI THÀNH VIÊN (Chỉ Trưởng nhóm)
    @Override
    @Transactional
    public void kickMember(Long groupId, String memberId, String requesterId) {
        // 1. Tìm nhóm
        StudyGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy nhóm"));

        // 2. Trạm kiểm soát: Chỉ trưởng nhóm mới có quyền đuổi!
        if (!group.getCreatedBy().equals(requesterId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Lỗi 403: Chỉ trưởng nhóm mới có quyền đuổi thành viên!");
        }

        // 3. Ngăn chặn Trưởng nhóm tự đuổi chính mình
        if (memberId.equals(requesterId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Bạn là trưởng nhóm, không thể tự đuổi chính mình. Hãy dùng chức năng Giải tán nhóm!");
        }
        groupMemberRepository.deleteById_GroupIdAndId_UserId(groupId, memberId);
    }
}