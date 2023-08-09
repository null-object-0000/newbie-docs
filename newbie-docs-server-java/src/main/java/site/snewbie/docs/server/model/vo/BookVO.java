package site.snewbie.docs.server.model.vo;

import lombok.Data;
import site.snewbie.docs.server.model.Book;

@Data
public class BookVO extends Book {
    private Integer loginUserAuthType;
}
