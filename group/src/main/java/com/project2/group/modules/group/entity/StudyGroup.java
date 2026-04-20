package com.project2.group.modules.group.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "groups")
@Getter
@Setter
public class StudyGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // tự động tăng id khi thêm mới
    private Long id;

    @Column(name = "group_name", nullable = false)
    private String groupName;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "invite_code", unique = true, nullable = false, length = 10)
    private String inviteCode;

    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();   // trigger của jpa, trước khi tạo mới sẽ chạy cái này
    }
}