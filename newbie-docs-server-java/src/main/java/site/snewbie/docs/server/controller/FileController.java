package site.snewbie.docs.server.controller;

import cn.hutool.core.lang.Singleton;
import cn.hutool.core.util.StrUtil;
import com.amazonaws.ClientConfiguration;
import com.amazonaws.Protocol;
import com.amazonaws.auth.AWSCredentials;
import com.amazonaws.auth.AWSCredentialsProvider;
import com.amazonaws.auth.BasicAWSCredentials;
import com.amazonaws.client.builder.AwsClientBuilder;
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.AmazonS3ClientBuilder;
import com.amazonaws.services.s3.model.CannedAccessControlList;
import com.amazonaws.services.s3.model.ObjectMetadata;
import com.amazonaws.services.s3.model.PutObjectRequest;
import com.amazonaws.services.s3.model.PutObjectResult;
import lombok.SneakyThrows;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import site.snewbie.docs.server.enums.ResultsStatusEnum;
import site.snewbie.docs.server.model.Results;
import site.snewbie.docs.server.model.ResultsException;

import java.net.URL;

import static com.amazonaws.services.s3.AmazonS3Client.S3_SERVICE_NAME;

@RestController
public class FileController extends BaseController {
    @Value("${amazon.s3.access.key}")
    private String accessKey;
    @Value("${amazon.s3.secret.key}")
    private String secretKey;
    @Value("${amazon.s3.endpoint}")
    private String endPoint;
    @Value("${amazon.s3.bucket.name}")
    private String bucketName;

    /**
     * 上传文件
     */
    @SneakyThrows
    @PostMapping("/api/files/upload")
    public Results<String> upload(@RequestParam(value = "file", required = true) MultipartFile uploadFile,
                          @RequestParam(value = "key", required = true) String key) {
        AmazonS3 s3Client = this.getAmazonS3Client();

        ObjectMetadata meta = new ObjectMetadata();
        meta.setContentLength(uploadFile.getInputStream().available());

        PutObjectRequest request = new PutObjectRequest(bucketName, key, uploadFile.getInputStream(), meta)
                .withCannedAcl(CannedAccessControlList.PublicRead);

        if (StrUtil.isNotBlank(uploadFile.getContentType())) {
            meta.setContentType(uploadFile.getContentType());
        }

        PutObjectResult putObjectResult = s3Client.putObject(request);
        if (putObjectResult == null) {
            throw new ResultsException(ResultsStatusEnum.FAILED_SERVER_ERROR);
        }

        URL url = s3Client.getUrl(bucketName, key);
        if (url == null) {
            throw new ResultsException(ResultsStatusEnum.FAILED_SERVER_ERROR);
        }

        return Results.success(url.toString());
    }

    private AmazonS3 getAmazonS3Client() {
        return Singleton.get(AmazonS3.class.getName(), () -> {
            AWSCredentialsProvider credentials = new AWSCredentialsProvider() {
                @Override
                public AWSCredentials getCredentials() {
                    return new BasicAWSCredentials(accessKey, secretKey);
                }

                @Override
                public void refresh() {

                }
            };

            ClientConfiguration clientCfg = new ClientConfiguration();
            clientCfg.setProtocol(Protocol.HTTP);

            return AmazonS3ClientBuilder.standard()
                    .withCredentials(credentials)
                    .withClientConfiguration(clientCfg)
                    .withEndpointConfiguration(new AwsClientBuilder.EndpointConfiguration(endPoint, S3_SERVICE_NAME))
                    .enablePathStyleAccess()
                    .build();
        });
    }
}
