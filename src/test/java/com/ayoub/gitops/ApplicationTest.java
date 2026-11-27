package com.ayoub.gitops;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
@SpringBootTest(properties={"app.message=Test message","app.auth.username=tester","app.auth.password=test-password"})
@AutoConfigureMockMvc
class ApplicationTest {
 @Autowired MockMvc mvc;
 @Test void anonymousRequestsAreRejected() throws Exception {
  mvc.perform(get("/api/tasks")).andExpect(status().isUnauthorized());
 }
 @Test void healthIsPublic() throws Exception {
  mvc.perform(get("/actuator/health")).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("UP"));
 }
 @Test void configuredMessageRequiresAuthentication() throws Exception {
  mvc.perform(get("/").with(httpBasic("tester","test-password"))).andExpect(status().isOk()).andExpect(jsonPath("$.message").value("Test message"));
 }
 @Test void validTaskCanBeCreatedAndListed() throws Exception {
  mvc.perform(post("/api/tasks").with(httpBasic("tester","test-password")).contentType(MediaType.APPLICATION_JSON)
   .content("{\"title\":\"Review deployment\",\"completed\":false}")).andExpect(status().isCreated()).andExpect(jsonPath("$.id").exists());
  mvc.perform(get("/api/tasks").with(httpBasic("tester","test-password"))).andExpect(status().isOk())
   .andExpect(jsonPath("$[?(@.title == 'Review deployment')]").exists());
 }
 @Test void rejectsBlankTitle() throws Exception {
  mvc.perform(post("/api/tasks").with(httpBasic("tester","test-password")).contentType(MediaType.APPLICATION_JSON)
   .content("{\"title\":\"  \",\"completed\":false}")).andExpect(status().isBadRequest());
 }
}
