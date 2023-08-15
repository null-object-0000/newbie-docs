package site.snewbie.docs.server.model.vo;

import lombok.Data;
import lombok.EqualsAndHashCode;
import site.snewbie.docs.server.model.entity.Book;

@Data
@EqualsAndHashCode(callSuper=false)
public class BookVO extends Book {
    private Integer loginUserAuthType;
}
