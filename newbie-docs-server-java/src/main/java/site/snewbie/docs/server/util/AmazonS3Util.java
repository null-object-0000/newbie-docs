package site.snewbie.docs.server.util;

import cn.hutool.core.io.IoUtil;
import cn.hutool.core.lang.Singleton;
import cn.hutool.core.util.StrUtil;
import cn.hutool.extra.spring.SpringUtil;
import com.amazonaws.ClientConfiguration;
import com.amazonaws.Protocol;
import com.amazonaws.auth.AWSStaticCredentialsProvider;
import com.amazonaws.auth.BasicAWSCredentials;
import com.amazonaws.client.builder.AwsClientBuilder;
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.AmazonS3ClientBuilder;
import com.amazonaws.services.s3.model.ObjectMetadata;
import com.amazonaws.services.s3.model.PutObjectRequest;
import com.amazonaws.services.s3.model.PutObjectResult;
import lombok.Data;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.InputStream;
import java.net.URL;

public final class AmazonS3Util {
    private final AmazonS3Config config;
    private final AmazonS3 client;

    private AmazonS3Util(boolean isPublic) {
        this.config = new AmazonS3Config(isPublic);

        ClientConfiguration clientCfg = new ClientConfiguration();
        clientCfg.setProtocol(this.config.getEndPoint().startsWith(Protocol.HTTPS.toString()) ? Protocol.HTTPS : Protocol.HTTP);

        this.client = AmazonS3ClientBuilder.standard()
                .withCredentials(new AWSStaticCredentialsProvider(new BasicAWSCredentials(this.config.getAccessKey(), this.config.getSecretKey())))
                .withClientConfiguration(clientCfg)
                .withEndpointConfiguration(new AwsClientBuilder.EndpointConfiguration(this.config.getEndPoint(), StrUtil.EMPTY))
                .withPathStyleAccessEnabled(config.getWithPathStyleAccess())
                .withChunkedEncodingDisabled(true)
                .build();
    }

    public static AmazonS3Util getInstance(boolean isPublic) {
        return Singleton.get(AmazonS3Util.class.getName() + "_" + isPublic, () -> new AmazonS3Util(isPublic));
    }

    private String getFullObjectKey(String key) {
        if (StrUtil.isBlank(key)) {
            throw new IllegalArgumentException("key is blank");
        }

        if (StrUtil.isBlank(this.config.getObjectKeyPrefix())) {
            return key;
        }

        return String.format("%s/%s", this.config.getObjectKeyPrefix(), key);
    }

    public boolean uploadString(String key, String data) {
        ByteArrayInputStream uploadStream = new ByteArrayInputStream(data.getBytes());

        ObjectMetadata meta = new ObjectMetadata();
        meta.setContentLength(uploadStream.available());
        meta.setContentType("text/plain");

        PutObjectRequest request = new PutObjectRequest(this.config.getBucketName(), this.getFullObjectKey(key), uploadStream, meta);

        PutObjectResult putObjectResult = this.client.putObject(request);
        return putObjectResult != null;
    }

    public String downloadString(String key) {
        InputStream inputStream = this.client.getObject(this.config.getBucketName(), this.getFullObjectKey(key)).getObjectContent();
        if (inputStream == null) {
            return null;
        }

        return IoUtil.readUtf8(inputStream);
    }

    public String upload(File file, String key) {
        PutObjectRequest request = new PutObjectRequest(this.config.getBucketName(), this.getFullObjectKey(key), file);

        PutObjectResult putObjectResult = this.client.putObject(request);
        if (putObjectResult == null) {
            return null;
        }

        URL url = this.client.getUrl(this.config.getBucketName(), this.getFullObjectKey(key));
        if (url == null) {
            return null;
        }

        String results = url.toString();
        if (StrUtil.isNotBlank(this.config.getObjectCdnDomain())) {
            results = StrUtil.replaceFirst(results, url.getHost(), this.config.getObjectCdnDomain());
        }
        return results;
    }

    @Data
    public static class AmazonS3Config {
        private Boolean withPathStyleAccess;
        private String accessKey;
        private String secretKey;
        private String endPoint;
        private String bucketName;
        private String objectKeyPrefix;
        private String objectCdnDomain;

        public AmazonS3Config() {
        }

        public AmazonS3Config(boolean isPublic) {
            String withPathStyleAccess = this.getProp(isPublic, "with-path-style-access");
            this.withPathStyleAccess = StrUtil.isNotBlank(withPathStyleAccess) && Boolean.parseBoolean(withPathStyleAccess);
            this.accessKey = this.getProp(isPublic, "access-key");
            this.secretKey = this.getProp(isPublic, "secret-key");
            this.endPoint = this.getProp(isPublic, "endpoint");
            this.bucketName = this.getProp(isPublic, "bucket-name");
            this.objectKeyPrefix = this.getProp(isPublic, "object-key-prefix");
            this.objectCdnDomain = this.getProp(isPublic, "object-cdn-domain");
        }

        private String getProp(boolean isPublic, String key) {
            if (isPublic) {
                String value = SpringUtil.getProperty(String.format("public.amazon.s3.%s", key));
                if (StrUtil.isNotBlank(value)) {
                    return value;
                }
            }

            return SpringUtil.getProperty(String.format("private.amazon.s3.%s", key));
        }
    }
}
