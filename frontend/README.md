# FlowOps frontend

Angular dashboard for the Secure GitOps Task API. Follow the root [RUN_GUIDE.md](../RUN_GUIDE.md) for the complete setup, including backend credentials and Kubernetes.

For development, start the API on localhost:8080, then run `npm install` and `npm start` in this directory. Visit http://localhost:4200. The development proxy forwards /backend/ to the API. Run `npm run build` and `npm test -- --watch=false` to check the frontend.

For Kubernetes the Nginx container serves the built frontend and proxies /backend/ to the backend Service. Credentials are kept in memory only and the task data is in-memory on the backend. This is an HTTP localhost lab: use TLS and a production-grade authentication design before exposing it.
