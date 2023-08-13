package site.snewbie.docs.server.dao;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import site.snewbie.docs.server.model.entity.Doc;

import java.util.List;

@Mapper
public interface DocDao {

    List<Doc> selectAllWithoutContent(@Param("bookSlug") String bookSlug);

    boolean exists(@Param("bookSlug") String bookSlug, @Param("docSlug") String docSlug);

    List<Doc> selectAllWithContent(@Param("bookSlug") String bookSlug);

    int selectMaxSort(@Param("bookSlug") String bookSlug, @Param("parentId") Long parentId);

    boolean insert(Doc doc);

    boolean update(Doc doc);

    boolean delete(@Param("id") Long id, @Param("updater") String updater);

    Long selectTotalDocsCount(@Param("bookId") Long bookId);

    Long selectTotalWordsCount(@Param("bookId") Long bookId);

    boolean changeParentId(@Param("id") Long id, @Param("parentId") Long parentId, @Param("updater") String updater);

    boolean changeTitle(@Param("id") Long id, @Param("newTitle") String newTitle, @Param("updater") String updater);

    Doc selectOneWithoutContent(@Param("id") Long id);

    Doc selectOneWithContent(@Param("id") Long id);

    Integer findIndex(@Param("parentId") Long parentId, @Param("id") Long id);

    List<Doc> findChildren(@Param("parentId") Long parentId);
}
