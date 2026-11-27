package com.ayoub.gitops;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
public class ApiController {
 @Value("${app.message:Hello from the GitOps demo!}") private String message;
 private final Map<UUID, Task> tasks = new ConcurrentHashMap<>();
 public record TaskInput(@NotBlank @Size(max=120) String title, boolean completed) {}
 public record Task(UUID id, String title, boolean completed) {}
 @GetMapping("/") public Map<String,String> home() { return Map.of("application","gitops-spring-demo","message",message); }
 @GetMapping("/api/tasks") public List<Task> list() { return tasks.values().stream().sorted(Comparator.comparing(Task::title)).toList(); }
 @GetMapping("/api/tasks/{id}") public Task get(@PathVariable UUID id) {
  Task t=tasks.get(id); if(t==null) throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Task not found"); return t;
 }
 @PostMapping("/api/tasks") @ResponseStatus(HttpStatus.CREATED)
 public Task create(@Valid @RequestBody TaskInput input) {
  Task t=new Task(UUID.randomUUID(),input.title().trim(),input.completed()); tasks.put(t.id(),t); return t;
 }
 @PutMapping("/api/tasks/{id}") public Task update(@PathVariable UUID id,@Valid @RequestBody TaskInput input) {
  Task t=new Task(id,input.title().trim(),input.completed());
  if(tasks.replace(id,t)==null) throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Task not found"); return t;
 }
 @DeleteMapping("/api/tasks/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
 public void delete(@PathVariable UUID id) {
  if(tasks.remove(id)==null) throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Task not found");
 }
}
