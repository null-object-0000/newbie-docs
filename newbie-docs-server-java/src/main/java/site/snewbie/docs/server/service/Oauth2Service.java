package site.snewbie.docs.server.service;

import cn.hutool.core.lang.Dict;
import cn.hutool.core.util.StrUtil;
import cn.hutool.http.Header;
import cn.hutool.http.HttpRequest;
import cn.hutool.http.HttpResponse;
import cn.hutool.http.HttpUtil;
import com.alibaba.fastjson2.JSONObject;
import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.apache.http.entity.ContentType;
import org.springframework.stereotype.Service;
import site.snewbie.docs.server.config.OAuth2Config;
import site.snewbie.docs.server.model.dto.User;

/**
 * github: https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps
 * gitee: https://gitee.com/api/v5/oauth_doc
 */
@Slf4j
@Service
public class Oauth2Service {
    @Resource
    private OAuth2Config config;

    public String codeApplyForToken(String code) {
        Dict params = new Dict();
        params.set("grant_type", config.getGrantType());
        params.set("client_id", config.getClientId());
        params.set("client_secret", config.getClientSecret());
        params.set("code", code);
        params.set("redirect_uri", config.getDefaultRedirectUri());

        HttpRequest request = HttpUtil.createPost(config.getTokenUri())
                .header(Header.ACCEPT, ContentType.APPLICATION_JSON.getMimeType())
                .form(params);

        try (HttpResponse response = request.execute()) {
            String body = response.body();
            JSONObject jsonObject = JSONObject.parseObject(body);
            return jsonObject.getString("access_token");
        }
    }

    public User getUserInfoByToken(String accessToken) {
        HttpRequest request = HttpUtil.createGet(config.getUserInfoUri())
                .header("Authorization", "Bearer " + accessToken)
                .form("access_token", accessToken);

        try (HttpResponse response = request.execute()) {
            String body = response.body();
            JSONObject jsonObject = JSONObject.parseObject(body);
            Integer id = jsonObject.getInteger("id");
            if (id == null || id <= 0) {
                return null;
            }

            String username = jsonObject.getString("name");
            String avatarUrl = jsonObject.getString("avatar_url");

            User user = new User();
            user.setId(id);
            user.setUsername(username);
            user.setAvatarUrl(avatarUrl);
            user.setDepartment(null);
            user.setIsAdminer(null);

            return user;
        }
    }
}
