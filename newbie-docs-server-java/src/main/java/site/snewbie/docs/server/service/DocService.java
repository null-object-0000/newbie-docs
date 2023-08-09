package site.snewbie.docs.server.service;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.util.StrUtil;
import jakarta.annotation.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import site.snewbie.docs.server.dao.DocDao;
import site.snewbie.docs.server.model.Book;
import site.snewbie.docs.server.model.Doc;
import site.snewbie.docs.server.model.Permission;
import site.snewbie.docs.server.model.User;
import site.snewbie.docs.server.model.vo.DocVO;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(rollbackFor = Exception.class)
public class DocService {
    @Resource
    private BookService bookService;
    @Resource
    private DocDao docDao;
    @Resource
    protected PermissionService permissionService;

    public DocVO dir(String bookSlug) {
        List<Doc> docs = docDao.selectAllWithoutContent(bookSlug);
        return this.docVOArray2DocVOTree(this.doc2DocVO(docs));
    }

    public DocVO get(String bookSlug, String docSlug) {
        List<Doc> docs = docDao.selectAllWithContent(bookSlug);
        DocVO results = this.docVOArray2DocVOTree(this.doc2DocVO(docs));
        if (StrUtil.isBlank(docSlug)) {
            return results;
        } else {
            Doc currentDoc = docs.stream()
                    .filter(doc -> docSlug.equals(doc.getSlug()))
                    .findFirst().orElse(null);
            if (currentDoc == null) {
                return null;
            }

            return this.buildDocVOTree(this.doc2DocVO(currentDoc), this.doc2DocVO(docs));
        }
    }

    public boolean exists(String bookSlug, String docSlug) {
        return docDao.exists(bookSlug, docSlug);
    }

    public Long put(Doc doc, User loginUser) {
        Book book = bookService.get(doc.getBookId(), doc.getBookSlug());
        if (book == null) {
            return null;
        }

        Doc parentDoc = this.get(book.getSlug(), doc.getParentSlug());
        if (parentDoc == null) {
            return null;
        }

        doc.setParentId(parentDoc.getId());
        doc.setParentSlug(parentDoc.getSlug());

        doc.setUpdater(loginUser.getUsername() + loginUser.getId());
        doc.setUpdateTime(LocalDateTime.now());

        doc.setSort(doc.getSort() == null ? docDao.selectMaxSort(doc.getBookSlug(), doc.getParentSlug()) + 1 : doc.getSort());

        if (doc.getId() == null || doc.getId() <= 0) {
            doc.setBookId(book.getId());
            doc.setBookSlug(book.getSlug());
            doc.setCreator(loginUser.getUsername() + loginUser.getId());
            doc.setCreateTime(LocalDateTime.now());
            boolean insertBookResult = docDao.insert(doc);
            if (!insertBookResult || doc.getId() == null || doc.getId() <= 0) {
                throw new RuntimeException("新增文档失败");
            }

            // 默认给自己加一个 adminer 权限
            Permission permission = new Permission();
            permission.setAuthType(1);
            permission.setDataType(2);
            permission.setOwnerType(1);
            permission.setDataId(doc.getId());
            permission.setDataSlug(String.format("%s/%s", book.getSlug(), doc.getSlug()));
            permission.setOwner(loginUser.getUsername() + loginUser.getId());
            Long addAdminerPermissionResult = permissionService.put(permission, loginUser);
            if (addAdminerPermissionResult == null || addAdminerPermissionResult <= 0) {
                throw new RuntimeException("新增权限失败");
            }

            return doc.getId();
        } else {
            boolean updateBookResult = docDao.update(doc);
            return updateBookResult ? doc.getId() : null;
        }
    }

    public boolean remove(String slug, User loginUser) {
        return docDao.delete(slug, loginUser.getUsername() + loginUser.getId());
    }

    private DocVO doc2DocVO(Doc doc) {
        DocVO docVO = new DocVO();
        BeanUtil.copyProperties(doc, docVO);

        if ("root".equals(doc.getSlug())) {
            docVO.setPath(String.format("/%s", doc.getBookSlug()));
        } else {
            docVO.setPath(String.format("/%s/%s", doc.getBookSlug(), doc.getSlug()));
        }

        return docVO;
    }

    private List<DocVO> doc2DocVO(List<Doc> docs) {
        return docs.stream().map(this::doc2DocVO).collect(Collectors.toList());
    }

    private DocVO docVOArray2DocVOTree(List<DocVO> docs) {
        DocVO root = docs.stream().filter(doc -> "root".equals(doc.getSlug())).findFirst().orElse(null);
        if (root == null) {
            return null;
        }

        Book book = bookService.get(root.getBookId(), root.getBookSlug());
        if (book == null) {
            return null;
        }

        root.setTitle(book.getTitle());

        return this.buildDocVOTree(root, docs);
    }

    private DocVO buildDocVOTree(DocVO parent, List<DocVO> docs) {
        List<DocVO> children = docs.stream().filter(doc -> parent.getSlug().equals(doc.getParentSlug())).collect(Collectors.toList());
        if (CollUtil.isNotEmpty(children)) {
            parent.setChildren(children);
            children.forEach(child -> this.buildDocVOTree(child, docs));
        }
        return parent;
    }

    public Long getTotalDocCount(String bookSlug) {
        return docDao.selectTotalDocCount(bookSlug);
    }

    public Long getTotalWordCount(String bookSlug) {
        // TODO: 回头应该改成每次更新的时候就更新这个字段
        return docDao.selectTotalWordCount(bookSlug);
    }

    public boolean changeParentSlug(String slug, String parentSlug, User loginUser) {
        return docDao.changeParentSlug(slug, parentSlug, loginUser.getUsername() + loginUser.getId());
    }
}
