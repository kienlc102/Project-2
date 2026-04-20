package com.project2.group.modules.group.repository;

import com.project2.group.modules.group.entity.StudyGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface GroupRepository extends JpaRepository<StudyGroup, Long> { // có sẵn các hàm save, findById, delete, findAll
    Optional<StudyGroup> findByInviteCode(String inviteCode);  // Optional : dữ liệu có thể rỗng
}