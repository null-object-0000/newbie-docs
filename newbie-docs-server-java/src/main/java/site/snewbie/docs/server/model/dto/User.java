package site.snewbie.docs.server.model.dto;

import cn.hutool.core.util.StrUtil;
import lombok.Data;

@Data
public class User {
    private String id;
    private String username;
    private String avatar;
    private String department;
    private Boolean isAdminer;

    public static boolean isNotLogin(User userInfo) {
        return userInfo == null || StrUtil.isBlank(userInfo.getId());
    }
}
