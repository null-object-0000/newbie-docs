package site.snewbie.docs.server.controller;

import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.util.StrUtil;
import lombok.Data;
import org.springframework.web.bind.annotation.*;
import site.snewbie.docs.server.enums.PermissionAuthType;
import site.snewbie.docs.server.enums.PermissionDataType;
import site.snewbie.docs.server.enums.ResultsStatusEnum;
import site.snewbie.docs.server.model.Results;
import site.snewbie.docs.server.model.UserOauth;
import site.snewbie.docs.server.model.dto.User;
import site.snewbie.docs.server.model.entity.Book;
import site.snewbie.docs.server.model.entity.Doc;
import site.snewbie.docs.server.model.entity.Permission;
import site.snewbie.docs.server.model.vo.DocVO;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/docs")
public class DocController extends BaseAssetController {

    private String getCurrentViewBook() {
        return super.httpRequest.getHeader("newbie-docs-book-slug");
    }

    private DocVO setPermission(DocVO docVO) {
        if (docVO == null){
            return null;
        }

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
        if (CollUtil.isEmpty(docs)) {
            return docs;
        }

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

        Book book = bookService.get(null, this.getCurrentViewBook());
        if (book == null) {
            return Results.failed(ResultsStatusEnum.FAILED_CLIENT_DATA_NOT_EXIST);
        } else {
            doc.setBookId(book.getId());
            doc.setBookSlug(book.getSlug());
        }

        boolean isCreate = doc.getId() == null || doc.getId() <= 0;
        if (isCreate) {
            this.checkBookPermission(doc.getBookId(), PermissionAuthType.EDITOR);
        } else {
            this.checkDocPermission(doc.getId(), PermissionAuthType.EDITOR);
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

        this.checkDocPermission(doc, PermissionAuthType.ADMINER);

        boolean result = docService.remove(doc.getId(), loginUser);
        if (result) {
            docService.submitUpdateDocsAndWordsCountTask(doc.getBookId(), doc.getId());
        }
        return Results.success(result);
    }

    @UserOauth
    @PostMapping("/move")
    public Results<Boolean> move(@RequestBody MoveRequest params) {
        if (params.getDropPosition() == null
                || params.getDragDocId() == null || params.getDragDocId() <= 0
                || params.getDropDocId() == null || params.getDropDocId() <= 0) {
            return Results.failed(ResultsStatusEnum.FAILED_CLIENT_PARAM_EMPTY);
        }

        User loginUser = super.getCurrentLoginUser();
        assert loginUser != null;

        this.checkDocPermission(params.getDragDocId(), PermissionAuthType.EDITOR);

        boolean result = docService.move(params.getDropPosition(), params.getDragDocId(), params.getDropDocId(), loginUser);
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

        this.checkDocPermission(params.getId(), PermissionAuthType.EDITOR);

        boolean result = docService.changeTitle(params.getId(), params.getNewTitle(), loginUser);
        return Results.success(result);
    }

    @Data
    public static class MoveRequest {
        private Integer dropPosition;
        private Long dragDocId;
        private Long dropDocId;
    }

    @Data
    public static class ChangeTitleRequest {
        private Long id;
        private String newTitle;
    }
}
