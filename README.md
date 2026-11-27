# Secure GitOps Task API

A local full-stack DevSecOps portfolio lab: an Angular task dashboard, an authenticated Spring Boot task API, container hardening, GitHub Actions checks and GitOps deployment through Kubernetes and Argo CD.

Start with [RUN_GUIDE.md](RUN_GUIDE.md) for Windows setup, API tests, automatic sync and Git revert. [PROJECT_EXPLANATION.md](PROJECT_EXPLANATION.md) explains the design and limitations. Record real evidence in [DEMO_RECORD.md](DEMO_RECORD.md).

**Verification status:** Kubernetes manifests rendered using kubectl 1.37.1. Angular and Maven tests/builds, image builds, security scanning, Argo synchronization and rollback have not been successfully run in the authoring environment. The Docker engine and external dependency registries were inaccessible there. Complete the live checks before making claims about results.
