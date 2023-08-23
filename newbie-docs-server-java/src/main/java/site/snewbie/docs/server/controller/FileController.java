package site.snewbie.docs.server.controller;

import cn.hutool.core.io.FileUtil;
import cn.hutool.core.util.IdUtil;
import cn.hutool.core.util.StrUtil;
import cn.hutool.crypto.digest.DigestUtil;
import lombok.SneakyThrows;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import site.snewbie.docs.server.enums.ResultsStatusEnum;
import site.snewbie.docs.server.model.Results;
import site.snewbie.docs.server.model.ResultsException;
import site.snewbie.docs.server.util.AmazonS3Util;

import java.io.File;

@RestController
public class FileController extends BaseController {
    private final static String UPLOAD_DIR = "/data/newbie-docs/files/";

    /**
     * 上传文件
     *
     * @param key 不能以 / 开头和结尾
     */
    @SneakyThrows
    @PostMapping("/api/files/upload")
    public Results<String> upload(@RequestParam(value = "isPublic", required = true) boolean isPublic,
                                  @RequestParam(value = "file", required = true) MultipartFile uploadFile,
                                  @RequestParam(value = "key", required = true) String key) {
        String dir = UPLOAD_DIR + IdUtil.randomUUID() + "/";

        try {
            File file = FileUtil.writeFromStream(uploadFile.getInputStream(), dir + uploadFile.getOriginalFilename());
            String url = AmazonS3Util.getInstance(isPublic).upload(file, key);
            if (StrUtil.isBlank(url)) {
                throw new ResultsException(ResultsStatusEnum.FAILED_SERVER_ERROR);
            }

            return Results.success(url);
        } finally {
            FileUtil.del(dir);
        }
    }

    @SneakyThrows
    @PostMapping("/api/files/image/upload")
    public Results<String> uploadImage(@RequestParam(value = "file", required = true) MultipartFile uploadFile) {
        String md5 = DigestUtil.md5Hex(uploadFile.getInputStream());

        String fileName = md5 + "." + FileUtil.extName(uploadFile.getOriginalFilename());

        return this.upload(true, uploadFile, "images/" + fileName);
    }

    @SneakyThrows
    @PostMapping("/api/files/video/upload")
    public Results<String> uploadVideo(@RequestParam(value = "file", required = true) MultipartFile uploadFile) {
        String md5 = DigestUtil.md5Hex(uploadFile.getInputStream());

        String fileName = md5 + "." + FileUtil.extName(uploadFile.getOriginalFilename());

        return this.upload(true, uploadFile, "videos/" + fileName);
    }
}
