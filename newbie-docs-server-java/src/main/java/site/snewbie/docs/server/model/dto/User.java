package site.snewbie.docs.server.model.dto;

import lombok.Data;

@Data
public class User {
    private Integer id;
    private String username;
    private String avatarUrl;
    private String department;
    private Boolean isAdminer;

    public static boolean isNotLogin(User userInfo) {
        return userInfo == null || userInfo.getId() == null || userInfo.getId() <= 0;
    }
}
