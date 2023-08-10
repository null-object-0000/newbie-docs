package site.snewbie.docs.server.model.vo;

import lombok.Data;
import site.snewbie.docs.server.model.entity.Doc;

import java.util.List;

@Data
public class DocVO extends Doc {
    private String path;

    private List<DocVO> children;

    private Integer loginUserAuthType;
}