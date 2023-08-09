package site.snewbie.docs.server.service;

import cn.hutool.core.util.StrUtil;
import jakarta.annotation.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import site.snewbie.docs.server.dao.BookDao;
import site.snewbie.docs.server.dao.DocDao;
import site.snewbie.docs.server.model.Book;
import site.snewbie.docs.server.model.Doc;
import site.snewbie.docs.server.model.Permission;
import site.snewbie.docs.server.model.User;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional(rollbackFor = Exception.class)
public class BookService {
    @Resource
    private BookDao bookDao;
    @Resource
    private DocDao docDao;
    @Resource
    protected PermissionService permissionService;

    public List<Book> dir() {
        return bookDao.selectAll();
    }

    public Book get(Long id, String slug) {
        return bookDao.selectOne(id, slug);
    }

    public boolean exists(String slug) {
        return this.get(null, slug) != null;
    }

    private Doc buildDoc(Book book, User loginUser, String title, String slug, Long parentId, String parentSlug) {
        Doc doc = new Doc();
        doc.setBookId(book.getId());
        doc.setBookSlug(book.getSlug());

        doc.setSlug(slug);
        doc.setParentId(parentId);
        doc.setParentSlug(parentSlug);
        doc.setEditor(2);
        doc.setContent(StrUtil.EMPTY);
        doc.setTitle(title);
        doc.setSort(0);
        doc.setCreator(loginUser.getUsername() + loginUser.getId());
        doc.setCreateTime(LocalDateTime.now());
        doc.setUpdater(loginUser.getUsername() + loginUser.getId());
        doc.setUpdateTime(LocalDateTime.now());

        return doc;
    }

    public Long put(Book book, User loginUser) {
        book.setUpdater(loginUser.getUsername() + loginUser.getId());
        book.setUpdateTime(LocalDateTime.now());

        book.setSort(book.getSort() == null ? bookDao.selectMaxSort() + 1 : book.getSort());

        if (book.getId() == null || book.getId() <= 0) {
            book.setCreator(loginUser.getUsername() + loginUser.getId());
            book.setCreateTime(LocalDateTime.now());
            boolean insertBookResult = bookDao.insert(book);
            if (insertBookResult && book.getId() != null && book.getId() > 0) {
                // 默认新增一个 “根” 文档
                Doc rootDoc = this.buildDoc(book, loginUser, StrUtil.EMPTY, "root", 0L, StrUtil.EMPTY);
                boolean insertRootDocResult = docDao.insert(rootDoc);
                if (!insertRootDocResult || rootDoc.getId() == null || rootDoc.getId() <= 0) {
                    throw new RuntimeException("新增根文档失败");
                }

                // 默认新增一个 “首页” 文档
                Doc homeDoc = this.buildDoc(book, loginUser, "首页", "home", rootDoc.getId(), rootDoc.getSlug());
                boolean insertHomeDocResult = docDao.insert(homeDoc);
                if (!insertHomeDocResult || homeDoc.getId() == null || homeDoc.getId() <= 0) {
                    throw new RuntimeException("新增首页文档失败");
                }

                // 默认给自己加一个 adminer 权限
                Permission permission = new Permission();
                permission.setAuthType(1);
                permission.setDataType(1);
                permission.setOwnerType(1);
                permission.setDataId(book.getId());
                permission.setDataSlug(book.getSlug());
                permission.setOwner(loginUser.getUsername() + loginUser.getId());
                Long addAdminerPermissionResult = permissionService.put(permission, loginUser);
                if (addAdminerPermissionResult == null || addAdminerPermissionResult <= 0) {
                    throw new RuntimeException("新增权限失败");
                }

                return book.getId();
            } else {
                return null;
            }
        } else {
            boolean updateBookResult = bookDao.update(book);
            return updateBookResult ? book.getId() : null;
        }

    }

    public boolean remove(String slug, User loginUser) {
        return bookDao.delete(slug, loginUser.getUsername() + loginUser.getId());
    }

    public boolean changeTitle(String slug, String newTitle, User loginUser) {
        return bookDao.updateTitle(slug, newTitle, loginUser.getUsername() + loginUser.getId());
    }

}