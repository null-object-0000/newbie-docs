package site.snewbie.docs.server.model.entity;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class Book {
    private Long id;
    private String slug;
    private String title;
    private String cover;
    private String description;
    private Long docsCount;
    private Long wordsCount;
    private String creator;
    private LocalDateTime createTime;
    private String updater;
    private LocalDateTime updateTime;
    private Integer sort;
}
