package site.snewbie.docs.server.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum PermissionDataType {
    BOOK(1),
    DOC(2);

    private final Integer value;
}
