# Open, run and demonstrate on Windows

## Prerequisites

Use Java 21, Maven, Node.js 24.15 or newer within the 24.x series, npm, Git, Docker Desktop running with Linux containers and WSL 2, kubectl, kind, an internet connection and a GitHub account.

- Docker: https://docs.docker.com/desktop/setup/install/windows-install/
- kubectl: https://kubernetes.io/docs/tasks/tools/install-kubectl-windows/
- kind: https://kind.sigs.k8s.io/docs/user/quick-start/#installation
- Git: https://git-scm.com/install/windows
- Maven: https://maven.apache.org/install.html
- Node.js: https://nodejs.org/en/download

In PowerShell check `java -version`, `mvn -v`, `git --version`, `docker version`, `kubectl version --client` and `kind version`. Docker must show both Client and Server. After adding programs to PATH, open a fresh terminal. Keep kubectl within one minor version of the cluster server.

## 1. Open and build

Extract the ZIP, open its gitops-spring-demo folder in VS Code, then open a PowerShell terminal in that folder.

```powershell
mvn -B clean verify
```

All tests must pass before proceeding. For the frontend, in a separate terminal in the frontend folder run:

```powershell
npm install
npm run build
npm test -- --watch=false
```

To run the API locally, set a temporary lab username and password in the project root terminal (choose a unique password), then start the application:

```powershell
$env:APP_AUTH_USERNAME = "demo"
$env:APP_AUTH_PASSWORD = Read-Host "Choose a temporary lab password"
java -jar target/gitops-demo-1.0.0.jar
```

In a second terminal use `curl.exe http://localhost:8080/actuator/health` (expected UP). Test protected access with `curl.exe -u demo http://localhost:8080/api/tasks` and enter the lab password when curl prompts. An unauthenticated request to /api/tasks should return 401.

To use the local Angular development server, keep the API running. From the frontend folder run `npm start` and open http://localhost:4200. Sign in with the lab credentials. The development proxy sends /backend/ to the API on port 8080. Stop both processes with Ctrl+C before using the later port-forwards.

## 2. Put the project in Git

Create a new EMPTY GitHub repository named gitops-spring-demo; do not add README or license during creation. For the simplest lab make it public; never commit credentials. Private repositories need Argo repository credentials and may require an eligible GitHub security plan for CodeQL.

In argocd/application.yaml replace REPLACE_ME with your GitHub username. Then replace YOUR_USERNAME in the remote URL below:

```powershell
git init -b main
git add .
git commit -m "Initial secure GitOps task API"
git remote add origin https://github.com/YOUR_USERNAME/gitops-spring-demo.git
git push -u origin main
```

If asked, set Git username/email and authenticate with GitHub. Confirm the files and Actions runs in GitHub. Investigate any failed checks rather than claiming success.

## 3. Cluster, image and Secret

```powershell
kind create cluster --name gitops-demo
kubectl config current-context
kubectl get nodes
docker build -t gitops-demo:1.0.0 .
kind load docker-image gitops-demo:1.0.0 --name gitops-demo
docker build -t gitops-frontend:1.0.0 ./frontend
kind load docker-image gitops-frontend:1.0.0 --name gitops-demo
kubectl create namespace gitops-demo
```

Verify the context is kind-gitops-demo before applying anything. All subsequent commands affect the selected context. To avoid placing a password in a command or Git, make a temporary environment file in your user profile using a text editor. Put the following two lines in it, replacing the example password with a unique lab password:

```text
APP_AUTH_USERNAME=demo
APP_AUTH_PASSWORD=choose-your-own-lab-password
```

Save it as `$env:USERPROFILE\gitops-demo-secret.env`, outside the repository. Then:

```powershell
kubectl -n gitops-demo create secret generic gitops-demo-auth --from-env-file="$env:USERPROFILE\gitops-demo-secret.env"
Remove-Item -LiteralPath "$env:USERPROFILE\gitops-demo-secret.env"
```

The Secret remains in Kubernetes. It is not managed by Argo or encrypted merely by being a Kubernetes Secret. Never commit it. For a new image build use a new tag, load it into kind, update the Deployment manifest and push.

## 4. Install Argo CD and deploy

```powershell
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
kubectl -n argocd rollout status deployment/argocd-server --timeout=300s
kubectl apply -f argocd/application.yaml
kubectl -n argocd get applications
```

Wait for gitops-spring-demo to become Synced and Healthy. Check `kubectl -n gitops-demo get pods,deploy,svc` and `kubectl -n gitops-demo rollout status deployment/gitops-demo --timeout=300s`.

In a second PowerShell terminal leave running:

```powershell
kubectl -n argocd port-forward svc/argocd-server 8081:443
```

Open https://localhost:8081 and sign in as admin. Your browser may show a local self-signed certificate warning. Get the initial password in another terminal:

```powershell
[Text.Encoding]::UTF8.GetString([Convert]::FromBase64String((kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath='{.data.password}')))
```

Do not commit or screenshot the password. If the initial secret no longer exists, follow official Argo CD password recovery instructions.

In another terminal leave running:

```powershell
kubectl -n gitops-demo port-forward svc/gitops-demo 8080:80
```

From another terminal, run `curl.exe -u demo http://localhost:8080/`; enter your lab password. The message should read Version 1 - Deployed with Argo CD. Health: `curl.exe http://localhost:8080/actuator/health`.

Open another terminal and keep this port-forward running to reach the Angular dashboard:

```powershell
kubectl -n gitops-demo rollout status deployment/gitops-frontend --timeout=300s
kubectl -n gitops-demo port-forward svc/gitops-frontend 4200:80
```

Open http://localhost:4200 and sign in with the Secret's demo username and password. Add, edit, complete and delete tasks. The frontend proxies through Nginx to the backend Service inside the cluster; the browser does not need the separate API port-forward for the dashboard. The API is in-memory, so tasks disappear when its Pod restarts.

## 5. Verify the API

The following commands prompt for your lab password. The ID returned by create is needed for the later commands. Do not use valuable data: tasks are lost on restart.

```powershell
curl.exe -i http://localhost:8080/api/tasks
curl.exe -u demo http://localhost:8080/api/tasks
curl.exe -u demo -H "Content-Type: application/json" -d '{\"title\":\"Review deployment\",\"completed\":false}' http://localhost:8080/api/tasks
```

The first command should be 401; list should return JSON; POST should return a task with an id. PowerShell native-command quoting varies; alternatively create the task using Invoke-RestMethod with a PSCredential:

```powershell
$credential = Get-Credential -UserName demo -Message "Enter your lab password"
$task = Invoke-RestMethod -Method Post -Uri http://localhost:8080/api/tasks -Authentication Basic -Credential $credential -AllowUnencryptedAuthentication -ContentType 'application/json' -Body '{"title":"Review deployment","completed":false}'
$task
Invoke-RestMethod -Method Get -Uri "http://localhost:8080/api/tasks/$($task.id)" -Authentication Basic -Credential $credential -AllowUnencryptedAuthentication
Invoke-RestMethod -Method Put -Uri "http://localhost:8080/api/tasks/$($task.id)" -Authentication Basic -Credential $credential -AllowUnencryptedAuthentication -ContentType 'application/json' -Body '{"title":"Review deployment","completed":true}'
Invoke-RestMethod -Method Delete -Uri "http://localhost:8080/api/tasks/$($task.id)" -Authentication Basic -Credential $credential -AllowUnencryptedAuthentication
```

AllowUnencryptedAuthentication is for this localhost-only demo, not real credentials or a network deployment. These Invoke-RestMethod flags require PowerShell 7; for Windows PowerShell 5.1 use curl.exe instead.

## 6. Change configuration through Git

Edit k8s/configmap.yaml: change the message to `Version 2 - Updated through GitOps`. In k8s/deployment.yaml change `demo.gitops/revision: "1"` to `demo.gitops/revision: "2"`. Save both:

```powershell
git add k8s/configmap.yaml k8s/deployment.yaml
git commit -m "Demonstrate GitOps configuration update"
git push
```

Wait for Argo polling or click Refresh in the UI. When the new revision is Synced and Healthy, check `kubectl -n gitops-demo rollout status deployment/gitops-demo --timeout=300s` and `curl.exe -u demo http://localhost:8080/`. The message should be version 2. Click the refresh button in the dashboard to fetch the current API message. Restart the port-forward if the old Pod disappears. Record actual output and screenshots in DEMO_RECORD.md.

## 7. Roll back

Run `git log --oneline -3`. If the update is the latest commit:

```powershell
git revert --no-edit HEAD
git push
```

If later commits exist, revert the update commit by its hash instead. Wait for Argo to sync. Check the revision, rollout and API response again. The message should return to version 1. Record actual results.

## 8. Stop, reopen and troubleshoot

Stop port-forwards with Ctrl+C. To reopen, start Docker, check `kind get clusters` and `kubectl get nodes`, and restart port-forwards. To permanently delete this lab cluster, first verify its name and run `kind delete cluster --name gitops-demo`. It deletes everything in that cluster.

- Maven dependency resolution: check internet, proxy and Maven Central access.
- Docker server unavailable: start Docker Desktop and check WSL2/virtualization.
- ImagePullBackOff: load the exact tag into the correct cluster; inspect `kubectl -n gitops-demo describe pod <pod-name>`.
- CreateContainerConfigError: ensure the gitops-demo-auth Secret exists in the gitops-demo namespace.
- Argo can't access Git: check repo URL, branch, connectivity and credentials.
- OutOfSync: confirm commits are pushed, click Refresh, and read sync errors.
- Unhealthy Pod: inspect `kubectl -n gitops-demo get pods`, `kubectl -n gitops-demo describe pod <pod-name>`, and `kubectl -n gitops-demo logs deployment/gitops-demo`.
- Old message: verify both changes and synced revision; confirm a new Pod is ready and restart port-forward.
- Dashboard cannot connect: verify both deployments are ready, use the frontend port-forward, then inspect `kubectl -n gitops-demo logs deployment/gitops-frontend` and the backend logs.
