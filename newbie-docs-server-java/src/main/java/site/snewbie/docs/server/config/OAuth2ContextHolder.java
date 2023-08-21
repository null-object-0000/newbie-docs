package site.snewbie.docs.server.config;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import site.snewbie.docs.server.model.dto.User;

public class OAuth2ContextHolder {
    public static OAuth2Context getContext() {
        return new OAuth2Context();
    }

    public static class OAuth2Context implements SecurityContext {

        @Override
        public Authentication getAuthentication() {
            return SecurityContextHolder.getContext().getAuthentication();
        }

        @Override
        public void setAuthentication(Authentication authentication) {
            SecurityContextHolder.getContext().setAuthentication(authentication);
        }

        public User getUser() {
            Authentication authentication = this.getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                return null;
            }

            OAuth2User oauth2User = null;
            if (authentication.getPrincipal() instanceof OAuth2User) {
                oauth2User = (OAuth2User) authentication.getPrincipal();
            }

            if (oauth2User == null) {
                return null;
            }

            User user = new User();
            user.setId(oauth2User.getAttribute("id"));
            user.setUsername(oauth2User.getAttribute("name"));
            user.setAvatarUrl(oauth2User.getAttribute("avatar_url"));

            // TODO: 待完善
            user.setDepartment(oauth2User.getAttribute("department"));
            user.setIsAdminer(true);
            return user;
        }
    }
}
