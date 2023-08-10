package site.snewbie.docs.server.model.entity;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class Doc {
    private Long id;
    private Long bookId;
    private Long parentId;
    private String slug;
    private String bookSlug;
    private String title;
    private Integer editor;
    private String content;
    private Integer wordsCount;
    private Integer sort;
    private String creator;
    private String updater;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
}
