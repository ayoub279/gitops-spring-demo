# Secure GitOps Task API — explanation

## Purpose and architecture

This local project combines software development, security and deployment. The Angular dashboard provides sign-in, task creation, editing, completion, deletion, filtering and the current API configuration message. The Spring Boot REST API supports task creation, listing, lookup, update and deletion. It uses an in-memory data store, so a restart or a Kubernetes rollout erases all tasks. It is not a database-backed production service.

Flow: developer commits code and manifests -> GitHub Actions builds and tests Angular and Spring Boot, builds and scans both images with Trivy, and runs CodeQL on Java -> Argo CD watches the Git repository -> Argo applies the desired Kustomize resources to a local kind Kubernetes cluster. Both local images are built and loaded separately: CI does not publish or deploy them.

The frontend is served by Nginx, which proxies /backend/ to the Kubernetes API service, so the browser uses one origin. The development server has its own proxy to localhost:8080. Credentials are kept in memory for the current page session, not localStorage. Sign-out or a reload clears them. The deployment badge is the API's configured message, not proof that Argo is healthy; verify Argo separately.

## API and security

GET / returns the configured deployment message. GET and POST /api/tasks and GET, PUT and DELETE /api/tasks/{id} manage tasks. Titles must be nonblank and at most 120 characters. HTTP Basic authentication protects these endpoints; only actuator health endpoints are public. Set APP_AUTH_USERNAME and APP_AUTH_PASSWORD externally. Spring hashes the supplied password with BCrypt at startup; credentials are not stored in the repository.

Basic authentication is only suitable here for a localhost lab. It transmits reusable credentials and must be protected by TLS in a real deployment. CSRF protection is disabled for this stateless API; do not expose it as a browser-facing production service without reconsidering CSRF, TLS, authentication, authorization and rate limiting. It has a single role and no audit logging, persistent storage, account lifecycle or secrets rotation.

Kubernetes references a separately created Secret. Kubernetes Secrets are not automatically encrypted at rest; use a real external secrets system and encryption at rest for production. The workload runs as a non-root user, drops capabilities, disallows privilege escalation, uses RuntimeDefault seccomp, and has a read-only root filesystem with a writable temporary volume. Requests, limits and health probes are defined.

## GitOps change and rollback

Argo CD watches k8s/ on main. A ConfigMap supplies APP_MESSAGE. Changing an environment-sourced ConfigMap alone will not update a running process, so the demo changes a Pod-template annotation at the same time. That starts a new Pod. To roll back, git revert creates a new commit restoring both values. Argo detects and applies it. Direct kubectl rollback is not a lasting GitOps rollback because auto-sync can restore Git's desired state.

Synced means Argo sees the cluster state as matching the desired revision; Healthy is Argo's resource health assessment. Verify the API response too. Auto-prune deletes managed resources removed from Git, so use it carefully.

## CI and security checks

The workflow builds and tests with Maven, builds the Docker image, scans it with Trivy, and analyzes Java with CodeQL. Trivy fails on detected fixable HIGH or CRITICAL image vulnerabilities; findings and database availability change over time. CodeQL code-scanning availability depends on repository visibility and GitHub account settings. Public repositories are the simplest route. Actions are version-tagged for this learning lab; pin to audited commit SHAs for a stronger supply-chain posture.

## Interview explanation

After actually running and recording the demo: “I built an Angular and Spring Boot task application with authenticated endpoints, input validation, automated tests, container hardening, GitHub Actions security checks and an Argo CD GitOps workflow. I demonstrated a configuration rollout and rollback through Git, and verified the application and cluster state.”

Only claim checks and features that ran successfully. This project is a focused local lab, not a production platform.
