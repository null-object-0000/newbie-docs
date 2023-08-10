package site.snewbie.docs.server.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum PermissionAuthType {
    ADMINER(1),
    EDITOR(2),
    VIEWER(3);

    private final Integer value;
}
