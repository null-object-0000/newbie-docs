package site.snewbie.docs.server.service;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.util.ObjectUtil;
import cn.hutool.core.util.StrUtil;
import cn.hutool.extra.emoji.EmojiUtil;
import cn.hutool.http.HtmlUtil;
import com.alibaba.fastjson2.JSONArray;
import com.alibaba.fastjson2.JSONObject;
import jakarta.annotation.Resource;
import lombok.Data;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import site.snewbie.docs.server.dao.BookDao;
import site.snewbie.docs.server.dao.DocDao;
import site.snewbie.docs.server.enums.ResultsStatusEnum;
import site.snewbie.docs.server.model.ResultsException;
import site.snewbie.docs.server.model.entity.Book;
import site.snewbie.docs.server.model.entity.Doc;
import site.snewbie.docs.server.model.entity.Permission;
import site.snewbie.docs.server.model.dto.User;
import site.snewbie.docs.server.model.vo.DocVO;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.List;
import java.util.concurrent.*;
import java.util.stream.Collectors;

@Service
@Transactional(rollbackFor = Exception.class)
public class DocService {
    @Resource
    private BookDao bookDao;
    @Resource
    private DocDao docDao;
    @Resource
    protected PermissionService permissionService;

    public DocVO dir(String bookSlug) {
        List<Doc> docs = docDao.selectAllWithoutContent(bookSlug);
        return this.docVOArray2DocVOTree(this.doc2DocVO(docs));
    }

    public Doc selectOneWithoutContent(Long id) {
        return docDao.selectOneWithoutContent(id);
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

    public DocVO getById(String bookSlug, Long id) {
        List<Doc> docs = docDao.selectAllWithContent(bookSlug);
        DocVO results = this.docVOArray2DocVOTree(this.doc2DocVO(docs));
        if (id == null || id <= 0) {
            return results;
        } else {
            Doc currentDoc = docs.stream()
                    .filter(doc -> id.equals(doc.getId()))
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
        Book book = bookDao.selectOne(doc.getBookId(), doc.getBookSlug());
        if (book == null) {
            return null;
        }

        Doc parentDoc = this.getById(book.getSlug(), doc.getParentId());
        if (parentDoc == null) {
            return null;
        }

        doc.setParentId(parentDoc.getId());

        doc.setUpdater(loginUser.getUsername() + loginUser.getId());
        doc.setUpdateTime(LocalDateTime.now());

        doc.setWordsCount(this.getWordsCount(doc));
        doc.setSort(doc.getSort() == null || doc.getSort() < 0 ? docDao.selectMaxSort(doc.getBookSlug(), doc.getParentId()) + 1 : doc.getSort());
        doc.setContent(EmojiUtil.toAlias(doc.getContent()));

        if (doc.getId() != null && doc.getId() > 0) {
            boolean updateDocResult = docDao.update(doc);
            if (updateDocResult) {
                return doc.getId();
            } else {
                throw new ResultsException(ResultsStatusEnum.FAILED_SERVER_ERROR, "更新 doc 失败");
            }
        }

        // 以下是新增 doc 的逻辑

        doc.setBookId(book.getId());
        doc.setBookSlug(book.getSlug());
        doc.setCreator(loginUser.getUsername() + loginUser.getId());
        doc.setCreateTime(LocalDateTime.now());
        boolean insertBookResult = docDao.insert(doc);
        if (!insertBookResult || doc.getId() == null || doc.getId() <= 0) {
            throw new ResultsException(ResultsStatusEnum.FAILED_SERVER_ERROR, "新增 doc 失败");
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
            throw new ResultsException(ResultsStatusEnum.FAILED_SERVER_ERROR, "新增 adminerPermission 失败");
        }

        return doc.getId();
    }

    public boolean remove(Long id, User loginUser) {
        return docDao.delete(id, loginUser.getUsername() + loginUser.getId());
    }

    /**
     * TODO: 性能优化
     */
    public boolean splice(Long id, Integer index, User loginUser) {
        Doc doc = docDao.selectOneWithoutContent(id);
        if (doc == null) {
            throw new ResultsException(ResultsStatusEnum.FAILED_CLIENT_DATA_NOT_EXIST);
        }

        List<Doc> parentChild = docDao.findChildren(doc.getParentId());
        if (CollUtil.isEmpty(parentChild)) {
            return false;
        }

        parentChild = parentChild.stream().filter(d -> ObjectUtil.notEqual(d.getId(), id)).collect(Collectors.toList());

        parentChild = parentChild.stream().sorted(Comparator.comparing(Doc::getSort)).collect(Collectors.toList());

        parentChild.add(index, doc);

        for (int i = 0; i < parentChild.size(); i++) {
            Doc d = new Doc();
            d.setId(parentChild.get(i).getId());
            d.setSort(i);
            d.setUpdater(loginUser.getUsername() + loginUser.getId());
            d.setUpdateTime(LocalDateTime.now());
            docDao.update(d);
        }

        return true;
    }

    /**
     * TODO: 性能优化
     */
    public boolean move(Integer dropPosition, Long dragDocId, Long dropDocId, User loginUser) {
        Doc dragDoc = docDao.selectOneWithoutContent(dragDocId);
        Doc dropDoc = docDao.selectOneWithoutContent(dropDocId);
        if (dragDoc == null || dropDoc == null) {
            throw new ResultsException(ResultsStatusEnum.FAILED_CLIENT_DATA_NOT_EXIST);
        }

        List<Doc> parentChild = docDao.findChildren(dropDoc.getParentId());
        if (CollUtil.isEmpty(parentChild)) {
            return false;
        }

        Long targetParentId = null;
        Integer targetIndex = null;
        if (Integer.valueOf(0).equals(dropPosition)) {
            targetParentId = dropDocId;
        } else {
            if (ObjectUtil.notEqual(dragDoc.getParentId(), dropDoc.getParentId())) {
                targetParentId = dropDoc.getParentId();
            }

            int currentIndex = CollUtil.indexOf(parentChild, d -> ObjectUtil.equal(d.getId(), dragDocId));
            int aboveIndex = CollUtil.indexOf(parentChild, d -> ObjectUtil.equal(d.getId(), dropDocId));

            // -1 为上方，1 为下方
            if (currentIndex >= 0 && aboveIndex >= 0) {
                if (currentIndex < aboveIndex) {
                    if (Integer.valueOf(-1).equals(dropPosition)) {
                        aboveIndex = aboveIndex - 1;
                    }
                } else {
                    if (Integer.valueOf(1).equals(dropPosition)) {
                        aboveIndex = aboveIndex + 1;
                    }
                }
            }

            targetIndex = aboveIndex;
        }

        if ((targetIndex == null || targetIndex < 0) && (targetParentId == null || targetParentId <= 0)) {
            return false;
        }

        // 看看是否要改变父级
        if (targetParentId != null && targetParentId > 0 && ObjectUtil.notEqual(dragDoc.getParentId(), targetParentId)) {
            dragDoc.setParentId(targetParentId);
            boolean result = docDao.changeParentId(dragDocId, targetParentId, loginUser.getUsername() + loginUser.getId());
            if (!result) {
                throw new ResultsException(ResultsStatusEnum.FAILED_SERVER_ERROR, "更新 doc 失败");
            }
        }

        // 看看是否要改变排序
        if (targetIndex != null && targetIndex >= 0) {
            List<Doc> newParentChild = parentChild.stream().filter(d -> ObjectUtil.notEqual(d.getId(), dragDocId))
                    .sorted(Comparator.comparing(Doc::getSort)).collect(Collectors.toList());

            newParentChild.add(targetIndex, dragDoc);

            for (int index = 0; index < newParentChild.size(); index++) {
                Doc doc = new Doc();
                doc.setId(newParentChild.get(index).getId());
                doc.setSort(index);
                doc.setUpdater(loginUser.getUsername() + loginUser.getId());
                doc.setUpdateTime(LocalDateTime.now());
                boolean result = docDao.update(doc);
                if (!result) {
                    throw new ResultsException(ResultsStatusEnum.FAILED_SERVER_ERROR, "更新 doc 失败");
                }
            }
        }

        return true;
    }

    public boolean changeTitle(Long id, String newTitle, User loginUser) {
        return docDao.changeTitle(id, newTitle, loginUser.getUsername() + loginUser.getId());
    }

    public boolean updateDocsAndWordsCount(Long id) {
        if (id == null || id <= 0) {
            return false;
        }

        // 更新文档数量、字数
        Long docsCount = docDao.selectTotalDocsCount(id);
        Long wordsCount = docDao.selectTotalWordsCount(id);

        return bookDao.updateDocsAndWordsCount(id, docsCount, wordsCount);
    }

    public boolean tryLock(Long id, String editingUser) {
        boolean updateEditingUserResult = docDao.updateEditingUser(id, editingUser);
        if (updateEditingUserResult) {
            return true;
        }

        // 占有失败，说明已被其他用户占有，看一下是否占有超时，是的话就释放锁
        Doc doc = docDao.selectOneWithoutContent(id);
        if (doc == null) {
            return false;
        }

        if (doc.getEditingUser() == null || doc.getEditingUser().isEmpty()) {
            return docDao.updateEditingUser(id, editingUser);
        }

        LocalDateTime updateTime = doc.getUpdateTime();
        LocalDateTime now = LocalDateTime.now();
        // 超过 5 分钟就释放锁
        if (updateTime == null || updateTime.plusMinutes(5).isBefore(now)) {
            return docDao.forceUpdateEditingUser(id, editingUser);
        } else {
            return false;
        }
    }

    public boolean tryUnlock(Long id, String editingUser) {
        // 先要判断是否是自己占有的锁
        if (this.tryLock(id, editingUser)) {
            return docDao.forceUpdateEditingUser(id, StrUtil.EMPTY);
        } else {
            return false;
        }
    }

    private final static ConcurrentHashMap<Long, ExecutorService> updateDocsAndWordsCountExecutors = new ConcurrentHashMap<>();

    public boolean submitUpdateDocsAndWordsCountTask(Long bookId, Long docId) {
        final Doc doc = docId == null || docId <= 0 ? null : docDao.selectOneWithContent(docId);
        final Long finalBookId = bookId == null && doc != null ? doc.getBookId() : bookId;
        if (finalBookId == null || finalBookId <= 0) {
            return false;
        }

        ExecutorService executor = updateDocsAndWordsCountExecutors.computeIfAbsent(finalBookId, k -> new ThreadPoolExecutor(
                1, 10, 0L, TimeUnit.MILLISECONDS,
                new ArrayBlockingQueue<>(10),
                new ThreadPoolExecutor.DiscardPolicy()));

        executor.submit(() -> {
            this.updateDocsAndWordsCount(finalBookId);
        });

        return true;
    }

    private DocVO doc2DocVO(Doc doc) {
        DocVO docVO = new DocVO();
        BeanUtil.copyProperties(doc, docVO);

        if ("root".equals(doc.getSlug())) {
            docVO.setPath(String.format("/%s", doc.getBookSlug()));
        } else {
            docVO.setPath(String.format("/%s/%s", doc.getBookSlug(), doc.getSlug()));
        }

        if (StrUtil.isNotBlank(doc.getContent())) {
            docVO.setContent(EmojiUtil.toUnicode(doc.getContent()));
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

        Book book = bookDao.selectOne(root.getBookId(), root.getBookSlug());
        if (book == null) {
            return null;
        }

        root.setTitle(book.getTitle());

        return this.buildDocVOTree(root, docs);
    }

    private DocVO buildDocVOTree(DocVO parent, List<DocVO> docs) {
        List<DocVO> children = docs.stream().filter(doc -> parent.getId().equals(doc.getParentId())).collect(Collectors.toList());
        if (CollUtil.isNotEmpty(children)) {
            parent.setChildren(children);
            children.forEach(child -> this.buildDocVOTree(child, docs));
        }
        return parent;
    }

    private int getWordsCount(Doc doc) {
        if (doc == null || StrUtil.isBlank(doc.getContent())) {
            return 0;
        }

        if (Integer.valueOf(2).equals(doc.getEditor())) {
            List<OutputBlockData> blocks = JSONArray.parseArray(doc.getContent()).toJavaList(OutputBlockData.class);
            if (CollUtil.isEmpty(blocks)) {
                return 0;
            }

            int wordsCount = 0;
            for (OutputBlockData block : blocks) {
                if (block.getData() == null) {
                    continue;
                }

                BlockToolData data = block.getData();

                if ("list".equals(block.getType())) {
                    if (CollUtil.isEmpty(data.getItems())) {
                        continue;
                    }

                    wordsCount += data.getItems().stream().map(item -> {
                        if (item instanceof JSONObject) {
                            return ((JSONObject) item).getString("content");
                        } else {
                            return StrUtil.EMPTY;
                        }
                    }).mapToInt(StrUtil::length).sum();
                } else if ("table".equals(block.getType())) {
                    if (CollUtil.isEmpty(data.getContent())) {
                        continue;
                    }

                    wordsCount += data.getItems().stream().map(item -> {
                        if (item instanceof JSONObject) {
                            return ((JSONObject) item).getJSONArray("item").toJavaList(String.class);
                        } else {
                            return new ArrayList<String>();
                        }
                    }).flatMap(Collection::stream).mapToInt(StrUtil::length).sum();
                } else {
                    wordsCount += StrUtil.length(data.getText());
                }
            }

            return wordsCount;
        } else if (Integer.valueOf(1).equals(doc.getEditor())) {
            return HtmlUtil.cleanHtmlTag(doc.getContent()).length();
        }

        return 0;
    }

    @Data
    private static class OutputBlockData {
        /**
         * list、table
         */
        private String type;
        private BlockToolData data;
    }

    @Data
    private static class BlockToolData {
        private String text;
        private JSONArray items;
        private JSONArray content;
    }

}
