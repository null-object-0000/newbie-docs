package site.snewbie.docs.server.dao;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import site.snewbie.docs.server.model.Doc;
import site.snewbie.docs.server.model.User;

import java.util.List;

@Mapper
public interface DocDao {

    List<Doc> selectAllWithoutContent(@Param("bookSlug") String bookSlug);

    boolean exists(@Param("bookSlug") String bookSlug, @Param("docSlug") String docSlug);

    List<Doc> selectAllWithContent(@Param("bookSlug") String bookSlug);

    int selectMaxSort(@Param("bookSlug") String bookSlug, @Param("parentSlug") String parentSlug);

    boolean insert(Doc doc);

    boolean update(Doc doc);

    boolean delete(String slug, String updater);

    Long selectTotalDocCount(@Param("bookSlug") String bookSlug);

    Long selectTotalWordCount(@Param("bookSlug") String bookSlug);

    boolean changeParentSlug(@Param("slug") String slug, @Param("parentSlug") String parentSlug, @Param("updater") String updater);
}
