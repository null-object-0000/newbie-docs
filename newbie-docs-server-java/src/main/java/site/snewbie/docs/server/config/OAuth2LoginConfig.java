package site.snewbie.docs.server.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.registration.InMemoryClientRegistrationRepository;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;
import org.springframework.security.web.SecurityFilterChain;

import static org.springframework.security.config.Customizer.withDefaults;

@Configuration
public class OAuth2LoginConfig {

    @Value("${security.oauth2.client.registration-id}")
    private String registrationId;
    @Value("${security.oauth2.client-id}")
    private String clientId;
    @Value("${security.oauth2.client-secret}")
    private String clientSecret;
    @Value("${security.oauth2.redirect-uri}")
    private String redirectUri;
    @Value("${security.oauth2.scopes}")
    private String scopes;
    @Value("${security.oauth2.authorization-uri}")
    private String authorizationUri;
    @Value("${security.oauth2.token-uri}")
    private String tokenUri;
    @Value("${security.oauth2.user-info-uri}")
    private String userInfoUri;
    @Value("${security.oauth2.user-name-attribute-name}")
    private String userNameAttributeName;
    @Value("${security.oauth2.client-name}")
    private String clientName;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .oauth2Login(withDefaults())
                .oauth2Client(withDefaults());
        return http.build();
    }

    @Bean
    public ClientRegistrationRepository clientRegistrationRepository() {
        return new InMemoryClientRegistrationRepository(this.clientRegistration());
    }

    private ClientRegistration clientRegistration() {
        return ClientRegistration.withRegistrationId(registrationId)
                .clientId(clientId).clientSecret(clientSecret)
                .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .redirectUri(redirectUri)
                .scope(scopes.split(","))
                .authorizationUri(authorizationUri)
                .tokenUri(tokenUri)
                .userInfoUri(userInfoUri)
                .userNameAttributeName(userNameAttributeName)
                .clientName(clientName)
                .build();
    }
}