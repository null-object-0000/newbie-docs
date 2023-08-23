package site.snewbie.docs.server.util;

import cn.hutool.core.io.IoUtil;
import cn.hutool.core.lang.Singleton;
import cn.hutool.core.util.StrUtil;
import cn.hutool.setting.dialect.Props;
import cn.hutool.setting.dialect.PropsUtil;
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
    private final boolean isPublic;
    private final AmazonS3Config config;
    private final AmazonS3 client;

    private AmazonS3Util(boolean isPublic) {
        String activeProfile = System.getProperty("spring.profiles.active");
        Props props = PropsUtil.getFirstFound(String.format("application-%s.properties", activeProfile), "application.properties");

        this.isPublic = isPublic;
        this.config = new AmazonS3Config(isPublic, props);

        ClientConfiguration clientCfg = new ClientConfiguration();
        clientCfg.setProtocol(this.config.getEndPoint().startsWith(Protocol.HTTPS.toString()) ? Protocol.HTTPS : Protocol.HTTP);
        clientCfg.setSignerOverride("S3SignerType");

        this.client = AmazonS3ClientBuilder.standard()
                .withCredentials(new AWSStaticCredentialsProvider(new BasicAWSCredentials(this.config.getAccessKey(), this.config.getSecretKey())))
                .withClientConfiguration(clientCfg)
                .withEndpointConfiguration(new AwsClientBuilder.EndpointConfiguration(this.config.getEndPoint(), StrUtil.EMPTY))
                .withPathStyleAccessEnabled(true)
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
        public String accessKey;
        public String secretKey;
        public String endPoint;
        public String bucketName;
        public String objectKeyPrefix;
        public String objectCdnDomain;

        public AmazonS3Config() {
        }

        public AmazonS3Config(boolean isPublic, Props props) {
            this.accessKey = this.getProp(isPublic, props, "access.key");
            this.secretKey = this.getProp(isPublic, props, "secret.key");
            this.endPoint = this.getProp(isPublic, props, "endpoint");
            this.bucketName = this.getProp(isPublic, props, "bucket.name");
            this.objectKeyPrefix = this.getProp(isPublic, props, "object.key.prefix");
            this.objectCdnDomain = this.getProp(isPublic, props, "object.cdn.domain");
        }

        private String getProp(boolean isPublic, Props props, String key) {
            if (isPublic) {
                if (props.containsKey(String.format("public.amazon.s3.%s", key))) {
                    return props.getStr(String.format("public.amazon.s3.%s", key));
                }
            }

            return props.getStr(String.format("private.amazon.s3.%s", key));
        }
    }
}