package site.snewbie.docs.server.model;

import lombok.Data;

@Data
public class User {
    private Long id;
    private String username;
    private String avatar;
    private String department;
}
