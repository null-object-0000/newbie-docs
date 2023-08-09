package site.snewbie.docs.server.dao;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import site.snewbie.docs.server.model.Book;

import java.util.List;

@Mapper
public interface BookDao {
    List<Book> selectAll();

    boolean insert(Book book);

    Book selectOne(@Param("id") Long id, @Param("slug") String slug);

    boolean delete(@Param("slug") String slug, @Param("updater") String updater);

    boolean updateTitle(@Param("slug") String slug, @Param("newTitle") String newTitle, @Param("updater") String updater);

    boolean update(Book book);

    int selectMaxSort();
}
