package site.snewbie.docs.server.controller;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.util.StrUtil;
import jakarta.annotation.Resource;
import lombok.Data;
import org.springframework.web.bind.annotation.*;
import site.snewbie.docs.server.UserOauth;
import site.snewbie.docs.server.model.Book;
import site.snewbie.docs.server.model.Permission;
import site.snewbie.docs.server.model.Results;
import site.snewbie.docs.server.model.User;
import site.snewbie.docs.server.model.vo.BookVO;
import site.snewbie.docs.server.service.BookService;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/books")
public class BookController extends BaseController {
    @Resource
    private BookService bookService;

    private BookVO book2VO(Book book) {
        BookVO bookVO = new BookVO();
        BeanUtil.copyProperties(book, bookVO);

        User loginUser = super.getCurrentLoginUser();
        if (loginUser != null) {
            Permission permission = super.getDataPermission(1, book.getId(), book.getSlug());
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
            return Results.failed("0001", "id、slug 不能同时为空");
        }

        Book book = bookService.get(id, slug);
        if (book == null) {
            return Results.failed("0001", "book 不存在");
        } else {
            return Results.success(this.book2VO(book));
        }
    }

    @GetMapping("/exists")
    public Results<Boolean> exists(String slug) {
        if (StrUtil.isBlank(slug)) {
            return Results.failed("0001", "slug 不能为空");
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
            return Results.failed("0001", "book 保存失败");
        } else {
            return Results.success(id);
        }
    }

    @UserOauth
    @PostMapping("/remove")
    public Results<Boolean> remove(@RequestBody Book book) {
        if (book.getId() == null || book.getId() <= 0) {
            return Results.failed("0001", "id 不能为空");
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
            return Results.failed("0001", "id、newTitle 不能为空");
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
