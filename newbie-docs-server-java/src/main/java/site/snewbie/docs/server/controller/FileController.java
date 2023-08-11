package site.snewbie.docs.server.controller;

import jakarta.annotation.Resource;
import lombok.SneakyThrows;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import site.snewbie.docs.server.enums.ResultsStatusEnum;
import site.snewbie.docs.server.model.Results;
import site.snewbie.docs.server.model.ResultsException;
import site.snewbie.docs.server.service.FileService;

import java.net.URL;

@RestController
public class FileController extends BaseController {
    @Resource
    private FileService fileService;

    /**
     * 上传文件
     */
    @SneakyThrows
    @PostMapping("/api/files/upload")
    public Results<String> upload(@RequestParam(value = "file", required = true) MultipartFile uploadFile,
                                  @RequestParam(value = "key", required = true) String key) {
        URL url = fileService.upload(uploadFile.getInputStream(), key, uploadFile.getContentType());
        if (url == null) {
            throw new ResultsException(ResultsStatusEnum.FAILED_SERVER_ERROR);
        }

        return Results.success(url.toString());
    }


}
