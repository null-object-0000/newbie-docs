package site.snewbie.docs.server.controller;

import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.util.StrUtil;
import jakarta.annotation.Resource;
import lombok.Data;
import org.springframework.web.bind.annotation.*;
import site.snewbie.docs.server.model.UserOauth;
import site.snewbie.docs.server.enums.ResultsStatusEnum;
import site.snewbie.docs.server.model.entity.Doc;
import site.snewbie.docs.server.model.entity.Permission;
import site.snewbie.docs.server.model.Results;
import site.snewbie.docs.server.model.dto.User;
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
            return Results.failed(ResultsStatusEnum.FAILED_CLIENT_PARAM_EMPTY);
        }

        DocVO docs = docService.dir(bookSlug);
        return Results.success(this.setPermission(docs));
    }

    @GetMapping("/get")
    public Results<DocVO> get(String slug) {
        String bookSlug = this.getCurrentViewBook();
        if (StrUtil.isBlank(bookSlug)) {
            return Results.failed(ResultsStatusEnum.FAILED_CLIENT_PARAM_EMPTY);
        }

        DocVO docs = docService.get(bookSlug, slug);
        return Results.success(this.setPermission(docs));
    }

    @GetMapping("/exists")
    public Results<Boolean> exists(String slug) {
        String bookSlug = this.getCurrentViewBook();
        if (StrUtil.isBlank(bookSlug)) {
            return Results.failed(ResultsStatusEnum.FAILED_CLIENT_PARAM_EMPTY);
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
            return Results.failed(ResultsStatusEnum.FAILED_SERVER_ERROR);
        } else {
            docService.submitUpdateDocsAndWordsCountTask(doc.getBookId(), doc.getId());
            return Results.success(id);
        }
    }

    @UserOauth
    @PostMapping("/remove")
    public Results<Boolean> remove(@RequestBody Doc doc) {
        if (StrUtil.isBlank(doc.getSlug())) {
            return Results.failed(ResultsStatusEnum.FAILED_CLIENT_PARAM_EMPTY);
        }

        User loginUser = super.getCurrentLoginUser();
        assert loginUser != null;

        boolean result = docService.remove(doc.getSlug(), loginUser);
        if (result) {
            docService.submitUpdateDocsAndWordsCountTask(doc.getBookId(), doc.getId());
        }
        return Results.success(result);
    }

    @UserOauth
    @PostMapping("/changeParentSlug")
    public Results<Boolean> changeParentSlug(@RequestBody ChangeParentSlugRequest params) {
        if (StrUtil.isBlank(params.getSlug()) || StrUtil.isBlank(params.getParentSlug())) {
            return Results.failed(ResultsStatusEnum.FAILED_CLIENT_PARAM_EMPTY);
        }

        User loginUser = super.getCurrentLoginUser();
        assert loginUser != null;

        boolean result = docService.changeParentSlug(params.getSlug(), params.getParentSlug(), loginUser);
        return Results.success(result);
    }

    @UserOauth
    @PostMapping("/changeTitle")
    public Results<Boolean> changeTitle(@RequestBody ChangeTitleRequest params) {
        if (StrUtil.isBlank(params.getSlug()) || StrUtil.isBlank(params.getNewTitle())) {
            return Results.failed(ResultsStatusEnum.FAILED_CLIENT_PARAM_EMPTY);
        }

        User loginUser = super.getCurrentLoginUser();
        assert loginUser != null;

        boolean result = docService.changeTitle(params.getSlug(), params.getNewTitle(), loginUser);
        return Results.success(result);
    }

    @Data
    public static class ChangeParentSlugRequest {
        private String slug;
        private String parentSlug;
    }

    @Data
    public static class ChangeTitleRequest {
        private String slug;
        private String newTitle;
    }
}
