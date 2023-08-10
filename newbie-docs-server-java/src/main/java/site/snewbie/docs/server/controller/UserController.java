package site.snewbie.docs.server.controller;

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
}
