package site.snewbie.docs.server.controller;

import cn.hutool.core.io.resource.ResourceUtil;
import cn.hutool.core.lang.Dict;
import cn.hutool.core.net.NetUtil;
import cn.hutool.core.util.StrUtil;
import cn.hutool.db.DbUtil;
import jakarta.annotation.Resource;
import jakarta.servlet.http.HttpServletResponse;
import site.snewbie.docs.server.controller.base.BaseController;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.SQLException;

@RestController
public class OtherController extends BaseController {

    @Resource
    private DataSource dataSource;

    @RequestMapping("/health")
    public Dict health() throws SQLException {
        Dict results = new Dict();
        results.put("status", "UP");
        results.put("localhost", NetUtil.getLocalhostStr());

        Number dbResult = DbUtil.use(dataSource)
                .queryNumber("select 1");

        results.put("db", dbResult != null && dbResult.intValue() == 1 ? "UP" : "DOWN");

        // 如果有 DOWN 的情况，就返回 500
        if (results.values().stream().anyMatch("DOWN"::equals)) {
            this.httpResponse.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }

        return results;
    }

    @GetMapping(value = "/error", produces = "text/html")
    public String error() {
        String html = ResourceUtil.readUtf8Str("public/index.html");
        if (StrUtil.isNotBlank(html)) {
            this.httpResponse.setStatus(HttpServletResponse.SC_OK);
            return html;
        } else {
            this.httpResponse.setStatus(HttpServletResponse.SC_NOT_FOUND);
            return "<h1>404 Not Found</h1>";
        }
    }

}
