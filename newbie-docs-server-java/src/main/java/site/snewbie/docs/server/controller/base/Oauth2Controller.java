package site.snewbie.docs.server.controller.base;

import cn.hutool.core.lang.Dict;
import cn.hutool.core.net.URLEncodeUtil;
import cn.hutool.core.util.IdUtil;
import cn.hutool.core.util.StrUtil;
import jakarta.annotation.Resource;
import jakarta.servlet.http.Cookie;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import site.snewbie.docs.server.config.OAuth2Config;
import site.snewbie.docs.server.model.Results;
import site.snewbie.docs.server.model.dto.User;
import site.snewbie.docs.server.util.ServletUtil;

import java.io.IOException;

@RestController
public class Oauth2Controller extends BaseController {
    @Value("${server.servlet.context-path}")
    private String contextPath;

    @Resource
    private OAuth2Config config;

    @GetMapping("/login/oauth2/authorization")
    public void oauth2Authorization() throws IOException {
        String state = IdUtil.simpleUUID();

        super.addCookie("oauth2.state", state);

        StringBuilder builder = new StringBuilder(config.getAuthorizationUri())
                .append("?response_type=code")
                .append("&client_id=").append(config.getClientId())
                .append("&scope=").append(config.getScope())
                .append("&state=").append(state)
                .append("&redirect_uri=")
                .append(URLEncodeUtil.encodeAll(config.getDefaultRedirectUri()));

        super.httpResponse.sendRedirect(builder.toString());
    }

    @GetMapping(value = { "/login/oauth2/code", "/login/oauth2/code/" })
    public void oauth2Code(@RequestParam(required = false) String state,
            @RequestParam(required = false) String code) throws IOException {
        String errorLocation = String.format("%s/login/oauth2/error", StrUtil.removeSuffix(contextPath, "/"));

        // check state
        Cookie stateCookie = ServletUtil.getCookie(super.httpRequest, "oauth2.state");
        if (stateCookie == null || !state.equals(stateCookie.getValue())) {
            super.httpResponse.sendRedirect(errorLocation);
            return;
        }

        String accessToken = oauth2Service.codeApplyForToken(code);
        if (StrUtil.isBlank(accessToken)) {
            super.httpResponse.sendRedirect(errorLocation);
            return;
        }

        super.addCookie("oauth2.access-token", accessToken);
        super.removeCookie("oauth2.state");
        super.httpResponse.sendRedirect(contextPath);
    }

    @GetMapping("/api/user/current")
    public Results<Dict> current() {
        User loginUser = super.getCurrentLoginUser();
        Dict result = loginUser == null ? Dict.create() : Dict.parse(loginUser);
        String contextPath = super.httpRequest.getContextPath();
        result.put("loginOauth2Url", String.format("%s/login/oauth2/authorization", contextPath));
        return Results.success(result);
    }

}
