package com.project2.group.modules.group.repository;

import com.project2.group.modules.group.entity.GroupMember;
import com.project2.group.modules.group.entity.GroupMemberId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GroupMemberRepository extends JpaRepository<GroupMember, GroupMemberId> {
    List<GroupMember> findByStudyGroup_Id(Long groupId);
    List<GroupMember> findById_UserId(String userId);
    Optional<GroupMember> findById_GroupIdAndId_UserId(Long groupId, String userId);
    boolean existsById_GroupIdAndId_UserId(Long groupId, String userId);
    // Xóa một thành viên khỏi nhóm (Dùng khi rời nhóm)
    void deleteById_GroupIdAndId_UserId(Long groupId, String userId);

    // Xóa tất cả thành viên của một nhóm (Dùng khi giải tán nhóm)
    void deleteByStudyGroup_Id(Long groupId);
    
}