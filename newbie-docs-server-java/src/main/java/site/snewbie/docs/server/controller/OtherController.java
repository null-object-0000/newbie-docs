package site.snewbie.docs.server.controller;

import cn.hutool.core.io.resource.ResourceUtil;
import cn.hutool.core.lang.Dict;
import cn.hutool.core.net.NetUtil;
import cn.hutool.core.util.StrUtil;
import cn.hutool.core.util.SystemPropsUtil;
import cn.hutool.db.DbUtil;
import cn.hutool.extra.spring.SpringUtil;
import cn.hutool.setting.dialect.PropsUtil;
import cn.hutool.system.SystemUtil;
import com.alibaba.fastjson2.JSONObject;
import com.alibaba.fastjson2.JSONWriter;
import jakarta.annotation.Resource;
import jakarta.servlet.http.HttpServletResponse;
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

    @GetMapping(value = "/test/getProp")
    public String getProp(String key) {
        JSONObject results = new JSONObject();

        results.put("env", System.getenv(key));
        results.put("env_lower_case_key", System.getenv(key.toLowerCase()));
        results.put("env_upper_case_key", System.getenv(key.toUpperCase()));

        results.put("system_prop", System.getProperty(key));

        JSONObject docker = new JSONObject();
        docker.put(key.toUpperCase().replace(".", "_").replace("-", "_"), System.getenv(key.toUpperCase().replace(".", "_").replace("-", "_")));
        docker.put(System.getenv(key.toUpperCase().replace(".", "-").replace("_", "-")), System.getenv(key.toUpperCase().replace(".", "-").replace("_", "-")));
        results.put("docker", docker);

        JSONObject hutool = new JSONObject();
        hutool.put("system_util", SystemUtil.get(key));
        hutool.put("spring_util", SpringUtil.getProperty(key));
        hutool.put("props_util", PropsUtil.getFirstFound(String.format("application-%s.properties", SpringUtil.getActiveProfile()), "application.properties").get(key));
        hutool.put("system_props_util", SystemPropsUtil.get(key));
        results.put("hutool", hutool);

        return results.toJSONString(JSONWriter.Feature.WriteNulls);
    }
}
