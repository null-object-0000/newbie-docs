package site.snewbie.docs.server.controller;

import cn.hutool.core.util.RandomUtil;
import jakarta.annotation.Resource;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.bind.annotation.RestController;
import site.snewbie.docs.server.model.entity.Permission;
import site.snewbie.docs.server.model.dto.User;
import site.snewbie.docs.server.service.PermissionService;

@RestController
public abstract class BaseController {
    @Resource
    protected HttpServletRequest httpRequest;
    @Resource
    protected HttpServletResponse httpResponse;

    @Resource
    protected PermissionService permissionService;

    protected User getCurrentLoginUser() {
        User mock = new User();
        mock.setId(10999999L);
        mock.setUsername("张三");
        mock.setAvatar("https://avatars.githubusercontent.com/u/10999999?v=4");
        mock.setDepartment("基础研发部");
        mock.setIsAdminer(true);
        return mock;
    }

    protected String generateSlug(int length) {
        while (true) {
            String slug = RandomUtil.randomString(length);
            // 不能以数字开头
            if (!slug.matches("^[0-9].*$")) {
                return slug;
            }
        }
    }

    /**
     * @param dataType 1 book 2 doc
     */
    protected Permission getDataPermission(Integer dataType, Long dataId, String dataSlug) {
        User loginUser = this.getCurrentLoginUser();

        // TODO: 回头这里每次一个新的请求进来就把当前用户的所有权限都查出来，然后缓存起来，这样就不用每次都查数据库了

        Permission result = null;
        if (loginUser != null) {
            Permission search = new Permission();
            search.setDataType(dataType);
            search.setDataId(dataId);
            search.setDataSlug(dataSlug);
            search.setOwnerType(1);
            search.setOwner(loginUser.getUsername() + loginUser.getId());

            result = permissionService.get(search);
        }

        if (Integer.valueOf(2).equals(dataType) && ("root".equals(dataSlug) || "home".equals(dataSlug))) {
            if (result == null) {
                result = new Permission();
                result.setAuthType(3);
                result.setDataType(dataType);
                result.setDataId(dataId);
                result.setDataSlug(dataSlug);
                result.setOwnerType(1);
                result.setOwner(loginUser == null ? "游客9999999" : loginUser.getUsername() + loginUser.getId());
            }
        }

        return result;
    }
}
