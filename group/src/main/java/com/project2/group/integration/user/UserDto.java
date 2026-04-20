package com.project2.group.integration.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data // generate getter, setter, equals, hashCode, toString
@Builder // generate builder pattern
@NoArgsConstructor // generate no-args constructor
@AllArgsConstructor // generate all-args constructor
public class UserDto {
    private String id;         
    private String fullName;
    private String avatarUrl;
    private String email;       
}