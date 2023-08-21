package site.snewbie.docs.server.controller;

import cn.hutool.core.lang.Dict;
import cn.hutool.core.util.StrUtil;
import cn.hutool.extra.servlet.ServletUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import site.snewbie.docs.server.model.Results;
import site.snewbie.docs.server.model.dto.User;

@RestController
@RequestMapping("/api/users")
public class UserController extends BaseController {
    @Value("${server.servlet.context-path}")
    private String contextPath;
    @Value("${security.oauth2.client.registration-id}")
    private String registrationId;

    @GetMapping("/current")
    public Results<Dict> current() {
        User loginUser = super.getCurrentLoginUser();
        Dict result = loginUser == null ? Dict.create() : Dict.parse(loginUser);
        String contextPath = super.httpRequest.getContextPath();
        result.put("loginOauth2Url", String.format("%s/oauth2/authorization/%s", contextPath, registrationId));
        return Results.success(result);
    }

}
