package com.project2.group.modules.group.controller;

import com.project2.group.integration.user.UserDto;
import com.project2.group.modules.group.entity.StudyGroup;
import com.project2.group.modules.group.service.GroupService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
public class GroupController {

    private final GroupService groupService;

    @PostMapping
    public ResponseEntity<StudyGroup> createGroup(
            @RequestBody Map<String, String> payload,
            @RequestHeader("X-User-Id") String userId) {
        String groupName = payload.get("groupName");
        String description = payload.get("description");
        StudyGroup createdGroup = groupService.createGroup(groupName, description, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdGroup);
    }

    @PostMapping("/join")
    public ResponseEntity<Map<String, String>> joinGroup(
            @RequestBody Map<String, String> payload,
            @RequestHeader("X-User-Id") String userId) {
        String inviteCode = payload.get("inviteCode");
        groupService.joinGroup(inviteCode, userId);
        return ResponseEntity.ok(Map.of("message", "Tham gia nhóm thành công"));
    }

    @GetMapping("/{groupId}/members")
    public ResponseEntity<List<UserDto>> getGroupMembers(
            @PathVariable Long groupId,
            @RequestHeader("X-User-Id") String userId) {

        // Truyền cả groupId và userId xuống cho tầng Service xử lý
        List<UserDto> members = groupService.getGroupMembers(groupId, userId);
        return ResponseEntity.ok(members);
    }

    @GetMapping("/my-groups")
    public ResponseEntity<List<StudyGroup>> getMyGroups(@RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(groupService.getMyGroups(userId));
    }

    @GetMapping("/{groupId}")
    public ResponseEntity<StudyGroup> getGroupDetails(
            @PathVariable Long groupId,
            @RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(groupService.getGroupDetails(groupId, userId));
    }

    @PutMapping("/{groupId}")
    public ResponseEntity<StudyGroup> updateGroup(
            @PathVariable Long groupId,
            @RequestBody Map<String, String> payload,
            @RequestHeader("X-User-Id") String userId) {
        return ResponseEntity
                .ok(groupService.updateGroup(groupId, payload.get("groupName"), payload.get("description"), userId));
    }

    @DeleteMapping("/{groupId}")
    public ResponseEntity<Map<String, String>> deleteGroup(
            @PathVariable Long groupId,
            @RequestHeader("X-User-Id") String userId) {
        groupService.deleteGroup(groupId, userId);
        return ResponseEntity.ok(Map.of("message", "Đã giải tán nhóm thành công"));
    }

    @PostMapping("/{groupId}/leave")
    public ResponseEntity<Map<String, String>> leaveGroup(
            @PathVariable Long groupId,
            @RequestHeader("X-User-Id") String userId) {
        groupService.leaveGroup(groupId, userId);
        return ResponseEntity.ok(Map.of("message", "Đã rời nhóm thành công"));
    }

    @DeleteMapping("/{groupId}/members/{memberId}")
    public ResponseEntity<Map<String, String>> kickMember(
            @PathVariable Long groupId,
            @PathVariable String memberId,
            @RequestHeader("X-User-Id") String requesterId) { // requesterId là ông đang bấm nút (hứng từ Token)

        groupService.kickMember(groupId, memberId, requesterId);
        return ResponseEntity.ok(Map.of("message", "Đã mời thành viên khỏi nhóm thành công"));
    }
}