package site.snewbie.docs.server.model.entity;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class Permission {
    private Long id;
    private Integer authType;
    private Integer dataType;
    private Long dataId;
    private String dataSlug;
    private String owner;
    private Integer ownerType;
    private String creator;
    private LocalDateTime createTime;
    private String updater;
    private LocalDateTime updateTime;
}
