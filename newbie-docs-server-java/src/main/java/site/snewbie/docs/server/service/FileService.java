package site.snewbie.docs.server.service;

import cn.hutool.core.lang.Singleton;
import cn.hutool.core.util.StrUtil;
import com.amazonaws.ClientConfiguration;
import com.amazonaws.Protocol;
import com.amazonaws.auth.AWSStaticCredentialsProvider;
import com.amazonaws.auth.BasicAWSCredentials;
import com.amazonaws.client.builder.AwsClientBuilder;
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.AmazonS3ClientBuilder;
import com.amazonaws.services.s3.model.CannedAccessControlList;
import com.amazonaws.services.s3.model.ObjectMetadata;
import com.amazonaws.services.s3.model.PutObjectRequest;
import com.amazonaws.services.s3.model.PutObjectResult;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.net.URL;

import static com.amazonaws.services.s3.AmazonS3Client.S3_SERVICE_NAME;

@Service
public class FileService {
    @Value("${amazon.s3.access.key}")
    private String accessKey;
    @Value("${amazon.s3.secret.key}")
    private String secretKey;
    @Value("${amazon.s3.endpoint}")
    private String endPoint;
    @Value("${amazon.s3.bucket.name}")
    private String bucketName;

    public AmazonS3 getAmazonS3Client() {
        return Singleton.get(AmazonS3.class.getName(), () -> {
            ClientConfiguration clientCfg = new ClientConfiguration();
            clientCfg.setProtocol(Protocol.HTTP);

            return AmazonS3ClientBuilder.standard()
                    .withCredentials(new AWSStaticCredentialsProvider(new BasicAWSCredentials(accessKey, secretKey)))
                    .withClientConfiguration(clientCfg)
                    .withEndpointConfiguration(new AwsClientBuilder.EndpointConfiguration(endPoint, StrUtil.EMPTY))
                    .withPathStyleAccessEnabled(false)
                    .withChunkedEncodingDisabled(true)
                    .build();
        });
    }

    public URL upload(InputStream uploadFile, String key, String contentType) throws IOException {
        AmazonS3 s3Client = this.getAmazonS3Client();

        ObjectMetadata meta = new ObjectMetadata();
        meta.setContentLength(uploadFile.available());

        PutObjectRequest request = new PutObjectRequest(bucketName, key, uploadFile, meta)
                .withCannedAcl(CannedAccessControlList.PublicRead);

        if (StrUtil.isNotBlank(contentType)) {
            meta.setContentType(contentType);
        }

        PutObjectResult putObjectResult = s3Client.putObject(request);
        if (putObjectResult == null) {
            return null;
        }

        return s3Client.getUrl(bucketName, key);
    }

}
