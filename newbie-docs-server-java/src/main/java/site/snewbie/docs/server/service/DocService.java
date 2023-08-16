package site.snewbie.docs.server.service;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.util.ObjectUtil;
import cn.hutool.core.util.StrUtil;
import cn.hutool.extra.emoji.EmojiUtil;
import cn.hutool.http.HtmlUtil;
import com.alibaba.fastjson2.JSONArray;
import com.alibaba.fastjson2.JSONObject;
import com.amazonaws.services.s3.model.AmazonS3Exception;
import jakarta.annotation.Resource;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import site.snewbie.docs.server.dao.BookDao;
import site.snewbie.docs.server.dao.DocDao;
import site.snewbie.docs.server.enums.ResultsStatusEnum;
import site.snewbie.docs.server.model.ResultsException;
import site.snewbie.docs.server.model.dto.User;
import site.snewbie.docs.server.model.entity.Book;
import site.snewbie.docs.server.model.entity.Doc;
import site.snewbie.docs.server.model.entity.Permission;
import site.snewbie.docs.server.model.vo.DocVO;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.List;
import java.util.concurrent.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@Transactional(rollbackFor = Exception.class)
public class DocService {
    @Resource
    private BookDao bookDao;
    @Resource
    private DocDao docDao;

    @Resource
    protected PermissionService permissionService;
    @Resource
    protected FileService fileService;

    public String getS3ObjectKey(Long bookId, Long docId) {
        if (bookId == null || bookId <= 0) {

        }
        return String.format("books/%d/%d", bookId, docId);
    }

    public DocVO dir(String bookSlug) {
        List<Doc> docs = docDao.selectAll(bookSlug);
        return this.docVOArray2DocVOTree(this.doc2DocVO(docs));
    }

    public Doc selectOneWithoutContent(Long id) {
        return docDao.selectOne(id);
    }

    public DocVO selectOneVO(Long id) {
        Doc doc = docDao.selectOne(id);
        if (doc == null) {
            return null;
        }

        return this.doc2DocVO(doc);
    }

    public DocVO get(String bookSlug, String docSlug) {
        List<Doc> docs = docDao.selectAll(bookSlug);
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
        List<Doc> docs = docDao.selectAll(bookSlug);
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

    public Long put(DocVO doc, User loginUser) {
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

        doc.setWordsCount(this.getWordsCount(doc.getEditor(), doc.getContent()));
        doc.setSort(doc.getSort() == null || doc.getSort() < 0
                ? docDao.selectMaxSort(doc.getBookSlug(), doc.getParentId()) + 1
                : doc.getSort());
        doc.setContent(EmojiUtil.toAlias(doc.getContent()));

        if (doc.getId() != null && doc.getId() > 0) {
            boolean updateDocResult = docDao.update(doc);
            if (!updateDocResult) {
                throw new ResultsException(ResultsStatusEnum.FAILED_SERVER_ERROR, "更新 doc 失败");
            }
        } else {
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
        }

        boolean uploadStringResult = fileService
                .uploadString(this.getS3ObjectKey(doc.getBookId(), doc.getId()), doc.getContent());
        if (!uploadStringResult) {
            throw new ResultsException(ResultsStatusEnum.FAILED_SERVER_ERROR, "上传 content 失败");
        }

        return doc.getId();
    }

    public boolean remove(Long id, User loginUser) {
        return docDao.delete(id, loginUser.getUsername() + loginUser.getId());
    }

    /**
     * TODO: 性能优化
     */
    public boolean move(Integer dropPosition, Long dragDocId, Long dropDocId, User loginUser) {
        Doc dragDoc = docDao.selectOne(dragDocId);
        Doc dropDoc = docDao.selectOne(dropDocId);
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
        if (targetParentId != null && targetParentId > 0
                && ObjectUtil.notEqual(dragDoc.getParentId(), targetParentId)) {
            dragDoc.setParentId(targetParentId);

            if (dragDocId.equals(targetParentId)) {
                throw new ResultsException(ResultsStatusEnum.FAILED_CLIENT_PARAM_EMPTY, "不能将文档移动到自己的子文档下");
            }

            boolean result = docDao.changeParentId(dragDocId, targetParentId,
                    loginUser.getUsername() + loginUser.getId());
            if (!result) {
                throw new ResultsException(ResultsStatusEnum.FAILED_SERVER_ERROR, "[changeParentId] 更新 doc 失败");
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
                    throw new ResultsException(ResultsStatusEnum.FAILED_SERVER_ERROR, "[update] 更新 doc 失败");
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
            log.debug("占有锁成功 {} {}", id, editingUser);
            return true;
        }

        // 占有失败，说明已被其他用户占有，看一下是否占有超时，是的话就释放锁
        Doc doc = docDao.selectOne(id);
        if (doc == null) {
            log.warn("占有锁失败，文档不存在 {} {}", id, editingUser);
            return false;
        }

        if (doc.getEditingUser() == null || doc.getEditingUser().isEmpty()) {
            log.warn("占有锁失败，文档已被释放，再次尝试站有锁 {} {}", id, editingUser);
            return docDao.updateEditingUser(id, editingUser);
        }

        LocalDateTime updateTime = doc.getUpdateTime();
        LocalDateTime now = LocalDateTime.now();
        // 超过 30s 就释放锁
        int timeout = 30;
        if (updateTime.plusSeconds(timeout).isBefore(now) && docDao.forceUpdateEditingUser(id, editingUser, timeout)) {
            log.info("占有锁失败，文档已被占有超过 {}s，释放锁 {} {}", timeout, id, editingUser);
            return true;
        } else {
            log.warn("占有锁失败，文档已被占有 {} {}", id, editingUser);
            throw new ResultsException(ResultsStatusEnum.FAILED_CLIENT_LOCKED,
                    String.format("文档已被 %s 占有", doc.getEditingUser()));
        }
    }

    public boolean tryUnlock(Long id, String editingUser) {
        // 先要判断是否是自己占有的锁
        if (this.tryLock(id, editingUser)) {
            return docDao.forceUpdateEditingUser(id, StrUtil.EMPTY, 0);
        } else {
            return false;
        }
    }

    private final static ConcurrentHashMap<Long, ExecutorService> updateDocsAndWordsCountExecutors = new ConcurrentHashMap<>();

    public boolean submitUpdateDocsAndWordsCountTask(Long bookId, Long docId) {
        final Doc doc = docId == null || docId <= 0 ? null : this.selectOneVO(docId);
        final Long finalBookId = bookId == null && doc != null ? doc.getBookId() : bookId;
        if (finalBookId == null || finalBookId <= 0) {
            return false;
        }

        ExecutorService executor = updateDocsAndWordsCountExecutors.computeIfAbsent(finalBookId,
                k -> new ThreadPoolExecutor(
                        1, 10, 0L, TimeUnit.MILLISECONDS,
                        new ArrayBlockingQueue<>(10),
                        new ThreadPoolExecutor.DiscardPolicy()));

        executor.submit(() -> {
            try {
                boolean result = this.updateDocsAndWordsCount(finalBookId);
                log.info("更新知识库【{}】 文档数量、字数：{} 更新结果：{}", finalBookId, finalBookId, result);
            } catch (Exception e) {
                log.error(StrUtil.format("更新文档数量、字数失败 {} {}", finalBookId, e.getMessage()), e);
            }
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

        try {
            String content = fileService
                    .downloadString(this.getS3ObjectKey(docVO.getBookId(), docVO.getId()));
            docVO.setContent(StrUtil.isBlank(content) ? StrUtil.EMPTY : EmojiUtil.toUnicode(content));
        } catch (AmazonS3Exception e) {
            if ("NoSuchKey".equals(e.getErrorCode())) {
                docVO.setContent(StrUtil.EMPTY);
            } else {
                throw e;
            }
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
        List<DocVO> children = docs.stream().filter(doc -> parent.getId().equals(doc.getParentId()))
                .collect(Collectors.toList());
        if (CollUtil.isNotEmpty(children)) {
            parent.setChildren(children);
            children.forEach(child -> this.buildDocVOTree(child, docs));
        }
        return parent;
    }

    private int getWordsCount(Integer editor, String content) {
        if (editor == null || editor <= 0 || StrUtil.isBlank(content)) {
            return 0;
        }

        if (Integer.valueOf(2).equals(editor)) {
            List<OutputBlockData> blocks = JSONArray.parseArray(content).toJavaList(OutputBlockData.class);
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
        } else if (Integer.valueOf(1).equals(editor)) {
            return HtmlUtil.cleanHtmlTag(content).length();
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
