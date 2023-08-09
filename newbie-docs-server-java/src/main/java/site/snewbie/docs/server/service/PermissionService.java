package site.snewbie.docs.server.service;

import jakarta.annotation.Resource;
import org.springframework.stereotype.Service;
import site.snewbie.docs.server.dao.PermissionDao;
import site.snewbie.docs.server.model.Permission;
import site.snewbie.docs.server.model.User;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class PermissionService {
    @Resource
    protected PermissionDao permissionDao;

    public Permission get(Permission permission) {
        return permissionDao.selectOne(permission);
    }

    public List<Permission> list(Permission permission) {
        return permissionDao.selectList(permission);
    }

    public Long put(Permission permission, User loginUser) {
        permission.setUpdater(loginUser.getUsername() + loginUser.getId());
        permission.setUpdateTime(LocalDateTime.now());

        if (permission.getId() == null || permission.getId() <= 0) {
            permission.setCreator(loginUser.getUsername() + loginUser.getId());
            permission.setCreateTime(LocalDateTime.now());
            boolean result = permissionDao.insert(permission);
            return result && permission.getId() != null && permission.getId() > 0 ? permission.getId() : null;
        } else {
            boolean result = permissionDao.update(permission);
            return result ? permission.getId() : null;
        }
    }

    public boolean remove(Long id, User loginUser) {
        return permissionDao.delete(id, loginUser.getUsername() + loginUser.getId());
    }

    public boolean changeAuthType(Long id, Integer newAuthType, User loginUser) {
        return permissionDao.updateAuthType(id, newAuthType, loginUser.getUsername() + loginUser.getId());
    }

}
