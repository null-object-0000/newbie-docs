package site.snewbie.docs.server.controller;

import cn.hutool.core.lang.Dict;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import site.snewbie.docs.server.model.Results;
import site.snewbie.docs.server.model.dto.User;

@RestController
@RequestMapping("/api/users")
public class UserController extends BaseController {

    @GetMapping("/current")
    public Results<User> current() {
        User loginUser = super.getCurrentLoginUser();
        return Results.success(loginUser);
    }

    @Value("${spring.datasource.url}")
    private String datasourceUrl;
    @Value("${spring.datasource.username}")
    private String datasourceUsername;
    @Value("${spring.datasource.password}")
    private String datasourcePassword;

    @Value("${amazon.s3.access.key}")
    private String amazonS3AccessKey;
    @Value("${amazon.s3.secret.key}")
    private String amazonS3SecretKey;
    @Value("${amazon.s3.endpoint}")
    private String amazonS3Endpoint;
    @Value("${amazon.s3.bucket.name}")
    private String amazonS3BucketName;

    @GetMapping("/test")
    public Results<Dict> test(){
        Dict dict = Dict.create();
        dict.set("datasourceUrl", datasourceUrl);
        dict.set("datasourceUsername", datasourceUsername);
        dict.set("datasourcePassword", datasourcePassword);

        dict.set("amazonS3AccessKey", amazonS3AccessKey);
        dict.set("amazonS3SecretKey", amazonS3SecretKey);
        dict.set("amazonS3Endpoint", amazonS3Endpoint);
        dict.set("amazonS3BucketName", amazonS3BucketName);
        return Results.success(dict);
    }
}
