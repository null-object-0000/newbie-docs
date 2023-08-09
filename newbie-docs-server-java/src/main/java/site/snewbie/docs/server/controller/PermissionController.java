package site.snewbie.docs.server.controller;

import jakarta.annotation.Resource;
import lombok.Data;
import org.springframework.web.bind.annotation.*;
import site.snewbie.docs.server.UserOauth;
import site.snewbie.docs.server.model.Permission;
import site.snewbie.docs.server.model.Results;
import site.snewbie.docs.server.model.User;
import site.snewbie.docs.server.service.PermissionService;

import java.util.List;

@RestController
@RequestMapping("/api/permissions")
public class PermissionController extends BaseController {
    @Resource
    private PermissionService permissionService;

    @GetMapping("/get")
    public Results<Permission> get(Permission permission) {
        Permission result = permissionService.get(permission);
        if (result == null) {
            return Results.failed("0001", "permission 不存在");
        } else {
            return Results.success(result);
        }
    }

    @GetMapping("/list")
    public Results<List<Permission>> list(Permission permission) {
        List<Permission> permissions = permissionService.list(permission);
        return Results.success(permissions);
    }

    @UserOauth
    @PostMapping("/put")
    public Results<Long> put(@RequestBody Permission permission) {
        User loginUser = super.getCurrentLoginUser();
        assert loginUser != null;

        Long id = permissionService.put(permission, loginUser);
        if (id == null || id <= 0) {
            return Results.failed("0001", "permission 保存失败");
        } else {
            return Results.success(id);
        }
    }

    @UserOauth
    @PostMapping("/remove")
    public Results<Boolean> remove(@RequestBody Permission permission) {
        User loginUser = super.getCurrentLoginUser();
        assert loginUser != null;

        boolean result = permissionService.remove(permission.getId(), loginUser);
        return Results.success(result);
    }

    @UserOauth
    @PostMapping("/changeAuthType")
    public Results<Boolean> updateAuthType(@RequestBody UpdateAuthTypeRequest params) {
        User loginUser = super.getCurrentLoginUser();
        assert loginUser != null;

        boolean result = permissionService.changeAuthType(params.getId(), params.getNewAuthType(), loginUser);
        return Results.success(result);
    }

    @Data
    public static class UpdateAuthTypeRequest {
        private Long id;
        private Integer newAuthType;
    }
}
