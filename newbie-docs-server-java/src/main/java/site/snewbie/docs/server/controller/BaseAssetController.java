package site.snewbie.docs.server.controller;

import jakarta.annotation.Resource;
import site.snewbie.docs.server.enums.PermissionAuthType;
import site.snewbie.docs.server.enums.PermissionDataType;
import site.snewbie.docs.server.enums.ResultsStatusEnum;
import site.snewbie.docs.server.model.ResultsException;
import site.snewbie.docs.server.model.entity.Book;
import site.snewbie.docs.server.model.entity.Doc;
import site.snewbie.docs.server.model.entity.Permission;
import site.snewbie.docs.server.service.BookService;
import site.snewbie.docs.server.service.DocService;

public class BaseAssetController extends BaseController {
    @Resource
    protected BookService bookService;
    @Resource
    protected DocService docService;

    protected void checkBookPermission(Long id, PermissionAuthType authType) {
        Book book = bookService.get(id, null);
        if (book == null) {
            throw new ResultsException(ResultsStatusEnum.FAILED_CLIENT_DATA_NOT_EXIST);
        } else {
            this.checkBookPermission(book, authType);
        }
    }

    protected void checkBookPermission(Book book, PermissionAuthType authType) {
        Permission bookPermission = super.getDataPermission(PermissionDataType.BOOK, book.getId(), book.getSlug());

        switch (authType) {
            case ADMINER -> {
                if (super.isNotAdminer(bookPermission)) {
                    throw new ResultsException(ResultsStatusEnum.FAILED_CLIENT_USER_AUTH_DENIED);
                }
            }
            case EDITOR -> {
                if (super.isNotEditor(bookPermission)) {
                    throw new ResultsException(ResultsStatusEnum.FAILED_CLIENT_USER_AUTH_DENIED);
                }
            }
            case VIEWER -> {
                if (super.isNotViewer(bookPermission)) {
                    throw new ResultsException(ResultsStatusEnum.FAILED_CLIENT_USER_AUTH_DENIED);
                }
            }
        }
    }

    protected void checkDocPermission(Long id, PermissionAuthType authType) {
        Doc doc = docService.selectOneWithoutContent(id);
        if (doc == null) {
            throw new ResultsException(ResultsStatusEnum.FAILED_CLIENT_DATA_NOT_EXIST);
        } else {
            this.checkDocPermission(doc, authType);
        }
    }

    protected void checkDocPermission(Doc doc, PermissionAuthType authType) {
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
}
