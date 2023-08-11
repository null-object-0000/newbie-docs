package site.snewbie.docs.server.service;

import com.amazonaws.services.s3.AmazonS3;
import jakarta.annotation.Resource;
import org.junit.jupiter.api.Test;
import site.snewbie.docs.server.NewbieDocsServerJavaApplicationTests;

import static org.junit.jupiter.api.Assertions.*;

public class FileServiceTest extends NewbieDocsServerJavaApplicationTests {
    @Resource
    private FileService fileService;

    @Test
    public void test() {
        AmazonS3 s3Client = fileService.getAmazonS3Client();

        s3Client.listBuckets().forEach(bucket -> {
            System.out.println(bucket.getName());
        });
    }
}