package site.snewbie.docs.server.interceptor;

import cn.hutool.core.annotation.AnnotationUtil;
import cn.hutool.core.util.BooleanUtil;
import cn.hutool.core.util.CharsetUtil;
import cn.hutool.core.util.StrUtil;
import com.alibaba.fastjson2.JSONObject;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.apache.http.entity.ContentType;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.resource.ResourceHttpRequestHandler;
import site.snewbie.docs.server.enums.ResultsStatusEnum;
import site.snewbie.docs.server.model.Results;
import site.snewbie.docs.server.model.UserOauth;
import site.snewbie.docs.server.model.dto.User;

import java.lang.reflect.Method;

@Component
@RequiredArgsConstructor
public class UserOauthInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request,  HttpServletResponse response, Object handler) throws Exception {
        if (HttpMethod.OPTIONS.matches(request.getMethod()) || handler instanceof ResourceHttpRequestHandler) {
            return HandlerInterceptor.super.preHandle(request, response, handler);
        }

        final Method method = ((HandlerMethod) handler).getMethod();
        final Class<?> clazz = method.getDeclaringClass();
        final boolean hasOauthAnnotation = AnnotationUtil.hasAnnotation(method, UserOauth.class) || AnnotationUtil.hasAnnotation(clazz, UserOauth.class);

        if (BooleanUtil.isFalse(hasOauthAnnotation)) {
            return HandlerInterceptor.super.preHandle(request, response, handler);
        }

        // TODO: 待完善
        User userInfo = null;
        if (User.isNotLogin(userInfo) && HttpMethod.GET.matches(request.getMethod())) {
            String returnUri = request.getRequestURL().toString();
            if (StrUtil.isNotBlank(request.getQueryString())) {
                returnUri = returnUri + "?" + request.getQueryString();
            }
            request.setAttribute("returnUri", returnUri);
            request.getRequestDispatcher("/api/oauth/applyfortoken").forward(request, response);
            return false;
        } else if (User.isNotLogin(userInfo) && HttpMethod.POST.matches(request.getMethod())) {
            response.setCharacterEncoding(CharsetUtil.UTF_8);
            response.setContentType(ContentType.APPLICATION_JSON.toString());
            response.getWriter().write(JSONObject.toJSONString(Results.failed(ResultsStatusEnum.FAILED_CLIENT_USER_NOT_LOGIN)));
            return false;
        }

        return HandlerInterceptor.super.preHandle(request, response, handler);
    }
}
