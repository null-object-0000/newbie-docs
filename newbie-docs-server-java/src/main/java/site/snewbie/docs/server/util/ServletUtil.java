package site.snewbie.docs.server.util;

import java.util.Map;

import cn.hutool.core.collection.ArrayIter;
import cn.hutool.core.collection.IterUtil;
import cn.hutool.core.map.CaseInsensitiveMap;
import cn.hutool.core.map.MapUtil;
import cn.hutool.core.util.ArrayUtil;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

public class ServletUtil {
    
	// --------------------------------------------------------- Cookie start

	/**
	 * 获得指定的Cookie
	 *
	 * @param httpServletRequest {@link HttpServletRequest}
	 * @param name               cookie名
	 * @return Cookie对象
	 */
	public static Cookie getCookie(HttpServletRequest httpServletRequest, String name) {
		return readCookieMap(httpServletRequest).get(name);
	}

	/**
	 * 将cookie封装到Map里面
	 *
	 * @param httpServletRequest {@link HttpServletRequest}
	 * @return Cookie map
	 */
	public static Map<String, Cookie> readCookieMap(HttpServletRequest httpServletRequest) {
		final Cookie[] cookies = httpServletRequest.getCookies();
		if (ArrayUtil.isEmpty(cookies)) {
			return MapUtil.empty();
		}

		return IterUtil.toMap(
				new ArrayIter<>(httpServletRequest.getCookies()),
				new CaseInsensitiveMap<>(),
				Cookie::getName);
	}

	/**
	 * 设定返回给客户端的Cookie
	 *
	 * @param response 响应对象{@link HttpServletResponse}
	 * @param cookie   Servlet Cookie对象
	 */
	public static void addCookie(HttpServletResponse response, Cookie cookie) {
		response.addCookie(cookie);
	}

	/**
	 * 设定返回给客户端的Cookie
	 *
	 * @param response 响应对象{@link HttpServletResponse}
	 * @param name     Cookie名
	 * @param value    Cookie值
	 */
	public static void addCookie(HttpServletResponse response, String name, String value) {
		response.addCookie(new Cookie(name, value));
	}

	/**
	 * 设定返回给客户端的Cookie
	 *
	 * @param response        响应对象{@link HttpServletResponse}
	 * @param name            cookie名
	 * @param value           cookie值
	 * @param maxAgeInSeconds -1: 关闭浏览器清除Cookie. 0: 立即清除Cookie. &gt;0 : Cookie存在的秒数.
	 * @param path            Cookie的有效路径
	 * @param domain          the domain name within which this cookie is visible; form is according to RFC 2109
	 */
	public static void addCookie(HttpServletResponse response, String name, String value, int maxAgeInSeconds, String path, String domain) {
		Cookie cookie = new Cookie(name, value);
		if (domain != null) {
			cookie.setDomain(domain);
		}
		cookie.setMaxAge(maxAgeInSeconds);
		cookie.setPath(path);
		addCookie(response, cookie);
	}

	/**
	 * 设定返回给客户端的Cookie<br>
	 * Path: "/"<br>
	 * No Domain
	 *
	 * @param response        响应对象{@link HttpServletResponse}
	 * @param name            cookie名
	 * @param value           cookie值
	 * @param maxAgeInSeconds -1: 关闭浏览器清除Cookie. 0: 立即清除Cookie. &gt;0 : Cookie存在的秒数.
	 */
	public static void addCookie(HttpServletResponse response, String name, String value, int maxAgeInSeconds) {
		addCookie(response, name, value, maxAgeInSeconds, "/", null);
	}

	// --------------------------------------------------------- Cookie end
}
