package site.snewbie.docs.server.config;

import cn.hutool.core.text.StrPool;
import cn.hutool.core.util.StrUtil;
import cn.hutool.extra.spring.SpringUtil;
import jakarta.annotation.Resource;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import lombok.Data;

@Data
@Configuration
public class OAuth2Config {

    @Value("${server.servlet.context-path}")
    private String contextPath;

    @Value("${oauth2.client-id}")
    private String clientId;
    @Value("${oauth2.client-secret}")
    private String clientSecret;
    @Value("${oauth2.grant-type}")
    private String grantType;
    @Value("${oauth2.redirect-uri}")
    private String redirectUri;
    @Value("${oauth2.scope}")
    private String scope;
    @Value("${oauth2.authorization-uri}")
    private String authorizationUri;
    @Value("${oauth2.token-uri}")
    private String tokenUri;
    @Value("${oauth2.user-info-uri}")
    private String userInfoUri;

    @Value("${oauth2.id-attribute-name}")
    private String idAttributeName;
    @Value("${oauth2.admin-user-ids}")
    private String adminUserIds;

    @Resource
    private HttpServletRequest httpRequest;

    public String getDefaultRedirectUri() {
        String baseUrl = httpRequest.getRequestURL().toString().replace(httpRequest.getRequestURI(), StrUtil.EMPTY)
                + contextPath;

        // 结尾没有斜杠的话，会导致重定向失败
        if (!baseUrl.endsWith(StrPool.SLASH)) {
            baseUrl += StrPool.SLASH;
        }

        return StrUtil.replace(this.redirectUri, "{baseUrl}/", baseUrl);
    }
}