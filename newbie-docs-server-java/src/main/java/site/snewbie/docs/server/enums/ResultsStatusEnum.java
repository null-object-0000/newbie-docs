package site.snewbie.docs.server.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum ResultsStatusEnum {
    SUCCESS("0000", "成功"),

    FAILED_CLIENT_PARAM_EMPTY("4101", "参数为空"),

    FAILED_CLIENT_DATA_EXIST("4201", "数据已存在"),
    FAILED_CLIENT_DATA_NOT_EXIST("4202", "数据不存在"),

    FAILED_CLIENT_USER_NOT_LOGIN("4301", "用户未登录"),
    FAILED_CLIENT_USER_AUTH_DENIED("4302", "用户权限不足"),

    FAILED_SERVER_ERROR("5000", "服务器错误"),

    FAILED("9999", "失败");

    private final String code;
    private final String msg;
}
