package site.snewbie.docs.server.model.dto;

import lombok.Data;

@Data
public class User {
    private Long id;
    private String username;
    private String avatar;
    private String department;
    private Boolean isAdminer;
}
