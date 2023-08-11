package site.snewbie.docs.server.controller;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.util.StrUtil;
import jakarta.annotation.Resource;
import lombok.Data;
import org.springframework.web.bind.annotation.*;
import site.snewbie.docs.server.enums.PermissionDataType;
import site.snewbie.docs.server.model.UserOauth;
import site.snewbie.docs.server.enums.ResultsStatusEnum;
import site.snewbie.docs.server.model.entity.Book;
import site.snewbie.docs.server.model.entity.Permission;
import site.snewbie.docs.server.model.Results;
import site.snewbie.docs.server.model.dto.User;
import site.snewbie.docs.server.model.vo.BookVO;
import site.snewbie.docs.server.service.BookService;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/books")
public class BookController extends BaseAssetController {
    @Resource
    private BookService bookService;

    private BookVO book2VO(Book book) {
        BookVO bookVO = new BookVO();
        BeanUtil.copyProperties(book, bookVO);

        User loginUser = super.getCurrentLoginUser();
        if (loginUser != null) {
            Permission permission = super.getDataPermission(PermissionDataType.BOOK, book.getId(), book.getSlug());
            if (permission != null) {
                bookVO.setLoginUserAuthType(permission.getAuthType());
            }
        }

        return bookVO;
    }

    private List<BookVO> book2VO(List<Book> books) {
        return books.stream().map(this::book2VO).collect(Collectors.toList());
    }

    @GetMapping("/dir")
    public Results<List<BookVO>> dir() {
        List<Book> books = bookService.dir();
        return Results.success(this.book2VO(books));
    }

    @GetMapping("/get")
    public Results<BookVO> get(@RequestParam(value = "id", required = false) Long id,
                               @RequestParam(value = "slug", required = false) String slug) {
        if ((id == null || id <= 0) && StrUtil.isBlank(slug)) {
            return Results.failed(ResultsStatusEnum.FAILED_CLIENT_PARAM_EMPTY);
        }

        Book book = bookService.get(id, slug);
        if (book == null) {
            return Results.failed(ResultsStatusEnum.FAILED_CLIENT_DATA_NOT_EXIST);
        } else {
            return Results.success(this.book2VO(book));
        }
    }

    @GetMapping("/exists")
    public Results<Boolean> exists(String slug) {
        if (StrUtil.isBlank(slug)) {
            return Results.failed(ResultsStatusEnum.FAILED_CLIENT_PARAM_EMPTY);
        }

        boolean exists = bookService.exists(slug);
        return Results.success(exists);
    }

    @UserOauth
    @PostMapping("/put")
    public Results<Long> put(@RequestBody Book book) {
        User loginUser = super.getCurrentLoginUser();
        assert loginUser != null;

        Long id = bookService.put(book, loginUser);
        if (id == null || id <= 0) {
            return Results.failed(ResultsStatusEnum.FAILED_SERVER_ERROR);
        } else {
            return Results.success(id);
        }
    }

    @UserOauth
    @PostMapping("/remove")
    public Results<Boolean> remove(@RequestBody Book book) {
        if (book.getId() == null || book.getId() <= 0) {
            return Results.failed(ResultsStatusEnum.FAILED_CLIENT_PARAM_EMPTY);
        }

        User loginUser = super.getCurrentLoginUser();
        assert loginUser != null;

        boolean result = bookService.remove(book.getId(), loginUser);
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

        boolean result = bookService.changeTitle(params.getId(), params.getNewTitle(), loginUser);
        return Results.success(result);
    }

    @Data
    public static class ChangeTitleRequest {
        private Long id;
        private String newTitle;
    }
}
