package site.snewbie.docs.server;

import java.lang.annotation.*;


@Retention(value = RetentionPolicy.RUNTIME)
@Target(value = {ElementType.METHOD, ElementType.TYPE})
public @interface UserOauth {

}
