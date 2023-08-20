package site.snewbie.docs.server.service;

import cn.hutool.core.io.IoUtil;
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

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URL;

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

    @Value("${amazon.s3.object.key.prefix}")
    private String objectKeyPrefix;
    @Value("${amazon.s3.object.cdn.domain}")
    private String objectCdnDomain;

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

    public String getFullObjectKey(String key) {
        if (StrUtil.isBlank(key)) {
            throw new IllegalArgumentException("key is blank");
        }

        if (StrUtil.isBlank(objectKeyPrefix)) {
            return key;
        }

        return String.format("%s/%s", objectKeyPrefix, key);
    }

    public boolean uploadString(String key, String data) {
        AmazonS3 s3Client = this.getAmazonS3Client();

        ByteArrayInputStream uploadStream = new ByteArrayInputStream(data.getBytes());

        ObjectMetadata meta = new ObjectMetadata();
        meta.setContentLength(uploadStream.available());
        meta.setContentType("text/plain");

        PutObjectRequest request = new PutObjectRequest(bucketName, this.getFullObjectKey(key), uploadStream, meta)
                .withCannedAcl(CannedAccessControlList.PublicRead);

        PutObjectResult putObjectResult = s3Client.putObject(request);
        return putObjectResult != null;
    }

    public String downloadString(String key) {
        AmazonS3 s3Client = this.getAmazonS3Client();

        InputStream inputStream = s3Client.getObject(bucketName, this.getFullObjectKey(key)).getObjectContent();
        if (inputStream == null) {
            return null;
        }

        return IoUtil.readUtf8(inputStream);
    }

    public String upload(InputStream uploadStream, String key, String contentType) throws IOException {
        AmazonS3 s3Client = this.getAmazonS3Client();

        ObjectMetadata meta = new ObjectMetadata();
        meta.setContentLength(uploadStream.available());
        if (StrUtil.isNotBlank(contentType)) {
            meta.setContentType(contentType);
        }

        PutObjectRequest request = new PutObjectRequest(bucketName, this.getFullObjectKey(key), uploadStream, meta)
                .withCannedAcl(CannedAccessControlList.PublicRead);

        PutObjectResult putObjectResult = s3Client.putObject(request);
        if (putObjectResult == null) {
            return null;
        }

        URL url = s3Client.getUrl(bucketName, this.getFullObjectKey(key));
        if (url == null) {
            return null;
        }

        String results = url.toString();
        if (StrUtil.isNotBlank(objectCdnDomain)) {
            results = StrUtil.replaceFirst(results, url.getHost(), objectCdnDomain);
        }
        return results;
    }

}
