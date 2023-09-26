package site.snewbie.docs.server.controller.base;

import jakarta.annotation.Resource;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.bind.annotation.RestController;

import cn.hutool.core.util.StrUtil;
import site.snewbie.docs.server.enums.PermissionAuthType;
import site.snewbie.docs.server.enums.PermissionDataType;
import site.snewbie.docs.server.model.dto.User;
import site.snewbie.docs.server.model.entity.Permission;
import site.snewbie.docs.server.service.Oauth2Service;
import site.snewbie.docs.server.service.PermissionService;
import site.snewbie.docs.server.util.ServletUtil;

@RestController
public abstract class BaseController {
    @Resource
    protected HttpServletRequest httpRequest;
    @Resource
    protected HttpServletResponse httpResponse;

    @Resource
    protected Oauth2Service oauth2Service;
    @Resource
    protected PermissionService permissionService;

    protected User getCurrentLoginUser() {
        Cookie accessTokenCookie = ServletUtil.getCookie(this.httpRequest, "oauth2.access-token");
        String accessToken = accessTokenCookie == null ? null : accessTokenCookie.getValue();
        if (StrUtil.isBlank(accessToken)) {
            return null;
        }

        User loginUser = (User) this.httpRequest.getAttribute("oauth2.access-token");
        if (loginUser != null) {
            return loginUser;
        }

        loginUser = oauth2Service.getUserInfoByToken(accessToken);
        if (loginUser != null) {
            this.httpRequest.setAttribute("oauth2.access-token", loginUser);
        }

        return loginUser;
    }

    protected boolean isAdminer(Permission permission) {
        User loginUser = this.getCurrentLoginUser();
        boolean isSystemAdminer = loginUser != null && loginUser.getIsAdminer();
        boolean isOwnerAdminer = permission != null
                && PermissionAuthType.ADMINER.getValue().equals(permission.getAuthType());
        return isSystemAdminer || isOwnerAdminer;
    }

    protected boolean isEditor(Permission permission) {
        boolean isAdminer = this.isAdminer(permission);
        boolean isOwnerEditor = permission != null
                && PermissionAuthType.EDITOR.getValue().equals(permission.getAuthType());
        return isAdminer || isOwnerEditor;
    }

    protected boolean isViewer(Permission permission) {
        boolean isEditor = this.isEditor(permission);
        boolean isOwnerViewer = permission != null
                && PermissionAuthType.VIEWER.getValue().equals(permission.getAuthType());
        return isEditor || isOwnerViewer;
    }

    protected boolean isNotAdminer(Permission permission) {
        return !this.isAdminer(permission);
    }

    protected boolean isNotEditor(Permission permission) {
        return !this.isEditor(permission);
    }

    protected boolean isNotViewer(Permission permission) {
        return !this.isViewer(permission);
    }

    /**
     * @param dataType 1 book 2 doc
     */
    protected Permission getDataPermission(PermissionDataType dataType, Long dataId, String dataSlug) {
        User loginUser = this.getCurrentLoginUser();

        // TODO: 回头这里每次一个新的请求进来就把当前用户的所有权限都查出来，然后缓存起来，这样就不用每次都查数据库了

        Permission result = null;
        if (loginUser != null) {
            Permission search = new Permission();
            search.setDataType(dataType.getValue());
            search.setDataId(dataId);
            search.setDataSlug(dataSlug);
            search.setOwnerType(1);
            search.setOwner(loginUser.getUsername() + loginUser.getId());

            result = permissionService.get(search);
        }

        if (PermissionDataType.DOC.equals(dataType) && ("root".equals(dataSlug) || "home".equals(dataSlug))) {
            if (result == null) {
                result = new Permission();
                result.setAuthType(PermissionAuthType.VIEWER.getValue());
                result.setDataType(dataType.getValue());
                result.setDataId(dataId);
                result.setDataSlug(dataSlug);
                result.setOwnerType(1);
                result.setOwner(loginUser == null ? "游客9999999" : loginUser.getUsername() + loginUser.getId());
            }
        }

        return result;
    }

    protected void removeCookie(String name){
        Cookie cookie = new Cookie(name, null);
        cookie.setPath("/");
        cookie.setMaxAge(0);
        httpResponse.addCookie(cookie);
    }

    protected void addCookie(String name, String value){
        Cookie cookie = new Cookie(name, value);
        cookie.setPath("/");
        httpResponse.addCookie(cookie);
    }

    protected void addCookie(String name, String value, int expiry){
        Cookie cookie = new Cookie(name, value);
        cookie.setPath("/");
        cookie.setMaxAge(expiry);
        httpResponse.addCookie(cookie);
    }

}
