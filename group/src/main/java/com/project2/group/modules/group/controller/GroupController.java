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
    public ResponseEntity<List<UserDto>> getGroupMembers(@PathVariable Long groupId) {
        List<UserDto> members = groupService.getGroupMembers(groupId);
        return ResponseEntity.ok(members);
    }
}