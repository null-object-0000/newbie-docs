package site.snewbie.docs.server.model.vo;

import lombok.Data;
import site.snewbie.docs.server.model.entity.Book;

@Data
public class BookVO extends Book {
    private Integer loginUserAuthType;
}
