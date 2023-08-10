package site.snewbie.docs.server.dao;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import site.snewbie.docs.server.model.entity.Permission;

import java.util.List;

@Mapper
public interface PermissionDao {

    boolean insert(Permission permission);

    boolean update(Permission permission);

    Permission selectOne(Permission permission);

    List<Permission> selectList(Permission permission);

    boolean delete(Long id, @Param("updater") String updater);

    boolean updateAuthType(Long id, @Param("newAuthType") Integer newAuthType, String updater);
}
