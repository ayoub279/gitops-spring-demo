package com.ayoub.gitops;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
@Configuration
public class SecurityConfig {
 @Bean PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(); }
 @Bean UserDetailsService users(@Value("${app.auth.username}") String username,@Value("${app.auth.password}") String password) {
  if(username.isBlank() || password.isBlank()) throw new IllegalArgumentException("APP_AUTH_USERNAME and APP_AUTH_PASSWORD must be set");
  return new InMemoryUserDetailsManager(User.withUsername(username).password(passwordEncoder().encode(password)).roles("USER").build());
 }
 @Bean SecurityFilterChain security(HttpSecurity http) throws Exception {
  return http.csrf(csrf -> csrf.disable()).sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
   .authorizeHttpRequests(a -> a.requestMatchers("/actuator/health","/actuator/health/**").permitAll().anyRequest().authenticated())
   .httpBasic(Customizer.withDefaults()).build();
 }
}
