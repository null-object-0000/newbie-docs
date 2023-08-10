package site.snewbie.docs.server.dao;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import site.snewbie.docs.server.model.entity.Book;

import java.util.List;

@Mapper
public interface BookDao {
    List<Book> selectAll();

    boolean insert(Book book);

    Book selectOne(@Param("id") Long id, @Param("slug") String slug);

    boolean delete(@Param("id") Long id, @Param("updater") String updater);

    boolean updateTitle(@Param("id") Long id, @Param("newTitle") String newTitle, @Param("updater") String updater);

    boolean update(Book book);

    int selectMaxSort();

    boolean updateDocsCount(@Param("id") Long id, @Param("docsCount") Long docsCount);

    boolean updateWordsCount(@Param("id") Long id, @Param("wordsCount") Long wordsCount);

    boolean updateDocsAndWordsCount(@Param("id") Long id, @Param("docsCount") Long docsCount, @Param("wordsCount") Long wordsCount);
}
