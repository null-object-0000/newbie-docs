package site.snewbie.docs.server.controller;

import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.util.StrUtil;
import jakarta.annotation.Resource;
import lombok.Data;
import org.springframework.web.bind.annotation.*;
import site.snewbie.docs.server.enums.PermissionAuthType;
import site.snewbie.docs.server.enums.PermissionDataType;
import site.snewbie.docs.server.model.ResultsException;
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
            Permission permission = super.getDataPermission(PermissionDataType.DOC, docVO.getId(), String.format("%s/%s", docVO.getBookSlug(), docVO.getSlug()));
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

    private void checkPermission(Long id, PermissionAuthType authType) {
        Doc doc = docService.selectOneWithoutContent(id);
        if (doc == null) {
            throw new ResultsException(ResultsStatusEnum.FAILED_CLIENT_DATA_NOT_EXIST);
        } else {
            this.checkPermission(doc, authType);
        }
    }

    private void checkPermission(Doc doc, PermissionAuthType authType) {
        Permission bookPermission = super.getDataPermission(PermissionDataType.BOOK, doc.getBookId(), doc.getSlug());
        Permission docPermission = super.getDataPermission(PermissionDataType.DOC, doc.getId(), String.format("%s/%s", doc.getBookSlug(), doc.getSlug()));

        switch (authType) {
            case ADMINER -> {
                if (super.isNotAdminer(bookPermission) && super.isNotAdminer(docPermission)) {
                    throw new ResultsException(ResultsStatusEnum.FAILED_CLIENT_USER_AUTH_DENIED);
                }
            }
            case EDITOR -> {
                if (super.isNotEditor(bookPermission) && super.isNotEditor(docPermission)) {
                    throw new ResultsException(ResultsStatusEnum.FAILED_CLIENT_USER_AUTH_DENIED);
                }
            }
            case VIEWER -> {
                if (super.isNotViewer(bookPermission) && super.isNotViewer(docPermission)) {
                    throw new ResultsException(ResultsStatusEnum.FAILED_CLIENT_USER_AUTH_DENIED);
                }
            }
        }
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

    @GetMapping("/getById")
    public Results<DocVO> getById(Long id) {
        String bookSlug = this.getCurrentViewBook();
        if (StrUtil.isBlank(bookSlug)) {
            return Results.failed(ResultsStatusEnum.FAILED_CLIENT_PARAM_EMPTY);
        }

        DocVO docs = docService.getById(bookSlug, id);
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

        boolean isCreate = doc.getId() == null || doc.getId() <= 0;
        if (isCreate) {
            this.checkPermission(doc.getId(), PermissionAuthType.ADMINER);
        } else {
            this.checkPermission(doc.getId(), PermissionAuthType.EDITOR);
        }

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
    public Results<Boolean> remove(@RequestBody Doc params) {
        if (params.getId() == null || params.getId() <= 0) {
            return Results.failed(ResultsStatusEnum.FAILED_CLIENT_PARAM_EMPTY);
        }

        User loginUser = super.getCurrentLoginUser();
        assert loginUser != null;

        Doc doc = docService.selectOneWithoutContent(params.getId());

        this.checkPermission(doc, PermissionAuthType.ADMINER);

        boolean result = docService.remove(doc.getId(), loginUser);
        if (result) {
            docService.submitUpdateDocsAndWordsCountTask(doc.getBookId(), doc.getId());
        }
        return Results.success(result);
    }

    @UserOauth
    @PostMapping("/changeParentId")
    public Results<Boolean> changeParentSlug(@RequestBody ChangeParentSlugRequest params) {
        if (params.getId() == null || params.getId() <= 0 || params.getParentId() == null || params.getParentId() <= 0) {
            return Results.failed(ResultsStatusEnum.FAILED_CLIENT_PARAM_EMPTY);
        }

        User loginUser = super.getCurrentLoginUser();
        assert loginUser != null;

        this.checkPermission(params.getId(), PermissionAuthType.EDITOR);

        boolean result = docService.changeParentSlug(params.getId(), params.getParentId(), loginUser);
        return Results.success(result);
    }

    @UserOauth
    @PostMapping("/changeTitle")
    public Results<Boolean> changeTitle(@RequestBody ChangeTitleRequest params) {
        if (params.getId() == null || params.getId() <= 0 || StrUtil.isBlank(params.getNewTitle())) {
            return Results.failed(ResultsStatusEnum.FAILED_CLIENT_PARAM_EMPTY);
        }

        User loginUser = super.getCurrentLoginUser();
        assert loginUser != null;

        this.checkPermission(params.getId(), PermissionAuthType.EDITOR);

        boolean result = docService.changeTitle(params.getId(), params.getNewTitle(), loginUser);
        return Results.success(result);
    }

    @Data
    public static class ChangeParentSlugRequest {
        private Long id;
        private Long parentId;
    }

    @Data
    public static class ChangeTitleRequest {
        private Long id;
        private String newTitle;
    }
}
