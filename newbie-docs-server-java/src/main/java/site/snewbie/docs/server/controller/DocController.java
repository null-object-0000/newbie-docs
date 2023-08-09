package site.snewbie.docs.server.controller;

import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.util.StrUtil;
import jakarta.annotation.Resource;
import lombok.Data;
import org.springframework.web.bind.annotation.*;
import site.snewbie.docs.server.UserOauth;
import site.snewbie.docs.server.model.Doc;
import site.snewbie.docs.server.model.Permission;
import site.snewbie.docs.server.model.Results;
import site.snewbie.docs.server.model.User;
import site.snewbie.docs.server.model.vo.DocVO;
import site.snewbie.docs.server.service.DocService;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/docs")
public class DocController extends BaseController {
    @Resource
    private DocService docService;

    private String getCurrentViewBook() {
        return super.httpRequest.getHeader("newbie-docs-book-slug");
    }

    private DocVO setPermission(DocVO docVO) {
        User loginUser = super.getCurrentLoginUser();
        if (loginUser != null) {
            Permission permission = super.getDataPermission(2, docVO.getId(), String.format("%s/%s", docVO.getBookSlug(), docVO.getSlug()));
            if (permission != null) {
                docVO.setLoginUserAuthType(permission.getAuthType());
            }
        }

        if (CollUtil.isNotEmpty(docVO.getChildren())) {
            docVO.setChildren(this.setPermission(docVO.getChildren()));
        }

        return docVO;
    }

    private List<DocVO> setPermission(List<DocVO> docs) {
        return docs.stream().map(this::setPermission).collect(Collectors.toList());
    }

    @GetMapping("/dir")
    public Results<DocVO> dir() {
        String bookSlug = this.getCurrentViewBook();
        if (StrUtil.isBlank(bookSlug)) {
            return Results.failed("0001", "book slug 不能为空");
        }

        DocVO docs = docService.dir(bookSlug);
        return Results.success(this.setPermission(docs));
    }

    @GetMapping("/get")
    public Results<DocVO> get(String slug) {
        String bookSlug = this.getCurrentViewBook();
        if (StrUtil.isBlank(bookSlug)) {
            return Results.failed("0001", "book slug 不能为空");
        }

        DocVO docs = docService.get(bookSlug, slug);
        return Results.success(this.setPermission(docs));
    }

    @GetMapping("/exists")
    public Results<Boolean> exists(String slug) {
        String bookSlug = this.getCurrentViewBook();
        if (StrUtil.isBlank(bookSlug)) {
            return Results.failed("0001", "book slug 不能为空");
        }

        boolean exists = docService.exists(bookSlug, slug);
        return Results.success(exists);
    }

    @UserOauth
    @PostMapping("/put")
    public Results<Long> put(@RequestBody Doc doc) {
        User loginUser = super.getCurrentLoginUser();
        assert loginUser != null;

        Long id = docService.put(doc, loginUser);
        if (id == null || id <= 0) {
            return Results.failed("0001", "doc 保存失败");
        } else {
            return Results.success(id);
        }
    }

    @UserOauth
    @PostMapping("/remove")
    public Results<Boolean> remove(@RequestBody Doc doc) {
        if (StrUtil.isBlank(doc.getSlug())) {
            return Results.failed("0001", "slug 不能为空");
        }

        User loginUser = super.getCurrentLoginUser();
        assert loginUser != null;

        boolean result = docService.remove(doc.getSlug(), loginUser);
        return Results.success(result);
    }

    @UserOauth
    @PostMapping("/changeParentSlug")
    public Results<Boolean> changeParentSlug(@RequestBody ChangeParentSlugRequest params) {
        if (StrUtil.isBlank(params.getSlug())) {
            return Results.failed("0001", "slug 不能为空");
        }
        if (StrUtil.isBlank(params.getParentSlug())) {
            return Results.failed("0001", "parent slug 不能为空");
        }

        User loginUser = super.getCurrentLoginUser();
        assert loginUser != null;

        boolean result = docService.changeParentSlug(params.getSlug(), params.getParentSlug(), loginUser);
        return Results.success(result);
    }

    @GetMapping("/getTotalDocCount")
    public Results<Long> getTotalDocCount() {
        String bookSlug = this.getCurrentViewBook();
        if (StrUtil.isBlank(bookSlug)) {
            return Results.failed("0001", "book slug 不能为空");
        }

        Long count = docService.getTotalDocCount(bookSlug);
        return Results.success(count == null ? 0 : count);
    }

    @GetMapping("/getTotalWordCount")
    public Results<Long> getTotalWordCount() {
        String bookSlug = this.getCurrentViewBook();
        if (StrUtil.isBlank(bookSlug)) {
            return Results.failed("0001", "book slug 不能为空");
        }

        Long count = docService.getTotalWordCount(bookSlug);
        return Results.success(count == null ? 0 : count);
    }

    @Data
    public static class ChangeParentSlugRequest {
        private String slug;
        private String parentSlug;
    }
}
