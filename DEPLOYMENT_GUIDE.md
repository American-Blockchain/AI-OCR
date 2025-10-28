# AI-OCR Deployment Guide

## Table of Contents

1. [Overview](#overview)
2. [Docker Test Environment](#docker-test-environment)
3. [Kubernetes Deployment](#kubernetes-deployment)
4. [CI/CD Pipelines](#cicd-pipelines)
5. [Continuous Deployment](#continuous-deployment)
6. [Metrics Dashboard](#metrics-dashboard)
7. [Troubleshooting](#troubleshooting)

## Overview

This comprehensive guide covers deploying the AI-OCR system across multiple cloud platforms (Azure AKS and Google Cloud GKE) with automated CI/CD pipelines, Helm-based infrastructure-as-code, and a real-time metrics dashboard for KPI monitoring.

### Architecture Overview

The deployment architecture consists of three layers:

**Layer 1: Container Runtime**
- Docker containerization for local testing and development
- Consistent image format across all environments

**Layer 2: Orchestration**
- Kubernetes clusters on Azure (AKS) and Google Cloud (GKE)
- Helm charts for declarative infrastructure management
- Automatic scaling and self-healing capabilities

**Layer 3: CI/CD & Continuous Deployment**
- GitHub Actions for automated builds and deployments
- Azure DevOps pipelines for enterprise integration
- ArgoCD for GitOps-based continuous deployment

**Layer 4: Monitoring & Analytics**
- Real-time KPI dashboard for efficiency, effectiveness, and resource metrics
- Integration with Langfuse for tracing and quality evaluation
- Binadox for cost tracking and governance

## Docker Test Environment

### Prerequisites

- Docker 20.10+
- Docker Compose 1.29+
- 8GB RAM minimum
- 20GB disk space

### Building the Docker Image

The project includes a Dockerfile optimized for the AI-OCR service with FastAPI:

```bash
# Navigate to the project directory
cd AI-OCR

# Build the Docker image
docker build -t ai-ocr:latest -f docker_build/Dockerfile .

# Verify the image was created
docker images | grep ai-ocr
```

### Running with Docker Compose

The `docker-compose.yaml` file provides a complete test environment:

```bash
# Start the service in detached mode
docker-compose up -d

# View logs
docker-compose logs -f ai-ocr-service

# Check service health
curl http://localhost:8000/health

# Stop the service
docker-compose down
```

### Environment Variables

Configure the following environment variables in `docker-compose.yaml`:

| Variable | Description | Example |
|----------|-------------|---------|
| `GEMINI_API_KEY` | Google Gemini API key | `AIzaSy...` |
| `GPT_API_KEY` | OpenAI GPT API key | `sk-...` |
| `LOG_LEVEL` | Application logging level | `INFO` |

### Testing the Service

```bash
# Health check
curl http://localhost:8000/health

# Process a document
curl -X POST http://localhost:8000/process_document \
  -H "Content-Type: application/json" \
  -d '{
    "document_path": "/path/to/document.pdf",
    "llm_model": "gemini"
  }'
```

## Kubernetes Deployment

### Prerequisites

- `kubectl` CLI installed and configured
- Access to AKS or GKE cluster
- `helm` 3.0+ installed
- Container registry access (ACR for Azure, GAR for Google Cloud)

### Helm Chart Structure

The Helm chart is located in `helm/ai-ocr/` with the following structure:

```
helm/ai-ocr/
├── Chart.yaml                 # Chart metadata
├── values.yaml               # Default configuration values
└── templates/
    ├── deployment.yaml       # Kubernetes Deployment
    ├── service.yaml          # Kubernetes Service
    └── _helpers.tpl          # Template helpers
```

### Deploying to AKS

**Step 1: Configure Azure CLI**

```bash
# Login to Azure
az login

# Set the subscription
az account set --subscription <subscription-id>

# Get AKS credentials
az aks get-credentials \
  --resource-group <resource-group> \
  --name <cluster-name> \
  --admin
```

**Step 2: Create Container Registry**

```bash
# Create Azure Container Registry
az acr create \
  --resource-group <resource-group> \
  --name <registry-name> \
  --sku Basic

# Get registry login credentials
az acr credential show \
  --name <registry-name> \
  --query "passwords[0].value" \
  --output tsv
```

**Step 3: Push Image to ACR**

```bash
# Login to ACR
az acr login --name <registry-name>

# Tag the image
docker tag ai-ocr:latest <registry-name>.azurecr.io/ai-ocr:latest

# Push to ACR
docker push <registry-name>.azurecr.io/ai-ocr:latest
```

**Step 4: Deploy with Helm**

```bash
# Create namespace
kubectl create namespace ai-ocr

# Deploy using Helm
helm install ai-ocr ./helm/ai-ocr \
  --namespace ai-ocr \
  --set image.repository=<registry-name>.azurecr.io/ai-ocr \
  --set image.tag=latest \
  --set replicaCount=3

# Verify deployment
kubectl get pods -n ai-ocr
kubectl get svc -n ai-ocr
```

### Deploying to GKE

**Step 1: Configure Google Cloud CLI**

```bash
# Set the project
gcloud config set project <project-id>

# Get GKE cluster credentials
gcloud container clusters get-credentials <cluster-name> \
  --zone <zone> \
  --project <project-id>
```

**Step 2: Create Artifact Registry**

```bash
# Create Artifact Registry repository
gcloud artifacts repositories create ai-ocr \
  --repository-format=docker \
  --location=us-central1

# Configure Docker authentication
gcloud auth configure-docker us-central1-docker.pkg.dev
```

**Step 3: Push Image to GAR**

```bash
# Tag the image
docker tag ai-ocr:latest \
  us-central1-docker.pkg.dev/<project-id>/ai-ocr/ai-ocr:latest

# Push to GAR
docker push \
  us-central1-docker.pkg.dev/<project-id>/ai-ocr/ai-ocr:latest
```

**Step 4: Deploy with Helm**

```bash
# Create namespace
kubectl create namespace ai-ocr

# Deploy using Helm
helm install ai-ocr ./helm/ai-ocr \
  --namespace ai-ocr \
  --set image.repository=us-central1-docker.pkg.dev/<project-id>/ai-ocr/ai-ocr \
  --set image.tag=latest \
  --set replicaCount=4

# Verify deployment
kubectl get pods -n ai-ocr
kubectl get svc -n ai-ocr
```

### Helm Values Configuration

Customize deployment behavior through `values.yaml`:

```yaml
# Replica count for high availability
replicaCount: 3

# Image configuration
image:
  repository: <your-registry>/ai-ocr
  pullPolicy: IfNotPresent
  tag: "latest"

# Service configuration
service:
  type: LoadBalancer
  port: 80

# Resource limits
resources:
  limits:
    cpu: 2000m
    memory: 4Gi
  requests:
    cpu: 1000m
    memory: 2Gi

# Autoscaling
autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 80
```

## CI/CD Pipelines

### GitHub Actions Workflows

#### AKS Deployment Workflow

The `.github/workflows/aks-deploy.yml` workflow automates deployment to Azure AKS:

**Trigger Events:**
- Push to `main` branch
- Manual workflow dispatch

**Pipeline Stages:**

1. **Checkout Code**: Clone the repository
2. **Azure Authentication**: Login using service principal credentials
3. **ACR Login**: Authenticate with Azure Container Registry
4. **Build & Push Image**: Build Docker image and push to ACR
5. **Set AKS Context**: Configure kubectl for AKS cluster
6. **Install Helm**: Download and install Helm CLI
7. **Deploy with Helm**: Apply Helm chart to AKS cluster

**Required Secrets:**

```
AZURE_CREDENTIALS          # Azure service principal credentials
AZURE_RESOURCE_GROUP       # Resource group name
AZURE_CLUSTER_NAME         # AKS cluster name
ACR_NAME                   # Container registry name
ACR_USERNAME               # Registry username
ACR_PASSWORD               # Registry password
```

**Usage:**

```bash
# Trigger manually from GitHub UI
# Or automatically on push to main
git push origin main
```

#### GKE Deployment Workflow

The `.github/workflows/gke-deploy.yml` workflow automates deployment to Google Cloud GKE:

**Trigger Events:**
- Push to `main` branch
- Manual workflow dispatch

**Pipeline Stages:**

1. **Checkout Code**: Clone the repository
2. **Google Cloud Authentication**: Authenticate using service account key
3. **Configure Docker**: Setup Docker for Google Artifact Registry
4. **Build & Push Image**: Build Docker image and push to GAR
5. **Get GKE Credentials**: Configure kubectl for GKE cluster
6. **Install Helm**: Download and install Helm CLI
7. **Deploy with Helm**: Apply Helm chart to GKE cluster

**Required Secrets:**

```
GCP_SA_KEY                 # Google Cloud service account key (JSON)
GCP_PROJECT_ID             # GCP project ID
GKE_CLUSTER_NAME           # GKE cluster name
GKE_ZONE                   # GKE cluster zone
```

**Usage:**

```bash
# Trigger manually or automatically on push
git push origin main
```

### Azure DevOps Pipelines

#### AKS Pipeline Configuration

The `azure-pipelines-aks.yml` pipeline provides enterprise-grade deployment:

**Stages:**

1. **Build Stage**: Build and push Docker image to ACR
2. **Deploy Stage**: Deploy to AKS using Helm

**Configuration:**

```yaml
trigger:
  - main

variables:
  azureSubscription: 'Azure Service Connection'
  resourceGroupName: 'your-resource-group'
  aksClusterName: 'your-aks-cluster'
  acrName: 'your-acr-registry'
  imageRepository: 'ai-ocr'
```

**Setup Instructions:**

1. Create service connections in Azure DevOps
2. Configure pipeline variables
3. Commit `azure-pipelines-aks.yml` to repository
4. Create pipeline from YAML file in Azure DevOps

#### GKE Pipeline Configuration

The `azure-pipelines-gke.yml` pipeline handles Google Cloud deployments:

**Stages:**

1. **Build Stage**: Build and push Docker image to GAR
2. **Deploy Stage**: Deploy to GKE using Helm

**Configuration:**

```yaml
trigger:
  - main

variables:
  gcpServiceConnection: 'GCP Service Connection'
  gcpProjectId: 'your-gcp-project'
  gkeClusterName: 'your-gke-cluster'
  gkeZone: 'us-central1-a'
  garLocation: 'us-central1'
```

**Setup Instructions:**

1. Create GCP service connection in Azure DevOps
2. Configure pipeline variables
3. Commit `azure-pipelines-gke.yml` to repository
4. Create pipeline from YAML file in Azure DevOps

## Continuous Deployment

### ArgoCD Setup

ArgoCD implements GitOps-based continuous deployment, automatically syncing cluster state with Git repository.

**Installation:**

```bash
# Create ArgoCD namespace
kubectl create namespace argocd

# Install ArgoCD
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Wait for ArgoCD to be ready
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=argocd-server -n argocd --timeout=300s
```

**Access ArgoCD UI:**

```bash
# Port forward to access UI
kubectl port-forward svc/argocd-server -n argocd 8080:443

# Get initial admin password
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d

# Access at https://localhost:8080
```

**Application Configuration:**

The `manifests/argocd/application.yaml` defines the AI-OCR deployment:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: ai-ocr
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/American-Blockchain/AI-OCR.git
    targetRevision: HEAD
    path: helm/ai-ocr
  destination:
    server: https://kubernetes.default.svc
    namespace: default
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

**Deploy Application:**

```bash
# Apply the ArgoCD application
kubectl apply -f manifests/argocd/application.yaml

# Monitor sync status
kubectl get application -n argocd
argocd app get ai-ocr
```

### GitOps Workflow

**Deployment Process:**

1. **Code Push**: Developer commits changes to Git repository
2. **CI Pipeline**: GitHub Actions or Azure DevOps builds and pushes image
3. **Image Tag**: Update Helm values with new image tag
4. **Git Commit**: Commit updated values to repository
5. **ArgoCD Sync**: ArgoCD detects changes and automatically syncs
6. **Cluster Update**: Kubernetes applies new deployment

**Example Workflow:**

```bash
# 1. Make code changes
git add .
git commit -m "feat: improve OCR accuracy"

# 2. Push to trigger CI pipeline
git push origin main

# 3. CI pipeline builds and pushes image
# (GitHub Actions or Azure DevOps runs automatically)

# 4. Update Helm values with new image tag
sed -i 's/tag: .*/tag: "v1.2.3"/' helm/ai-ocr/values.yaml
git add helm/ai-ocr/values.yaml
git commit -m "chore: update image tag to v1.2.3"
git push origin main

# 5. ArgoCD automatically syncs within 3 minutes
# (or manually trigger: argocd app sync ai-ocr)
```

## Metrics Dashboard

### Dashboard Overview

The AI-OCR Metrics Dashboard provides real-time KPI visualization based on the measurement framework from the provided documentation. It tracks efficiency, effectiveness, and resource consumption metrics across AKS and GKE deployments.

### Key Metrics

**Efficiency Metrics:**
- **Token Compression Ratio**: Measures compression effectiveness (target: 4.0x)
- **End-to-End Latency**: Total pipeline time from document input to final answer (target: < 1.5s)
- **Cost per Document**: Business-critical metric tracking all API costs (target: < $0.005)

**Effectiveness Metrics:**
- **OCR Decoding Precision**: Character/Word error rate against ground truth
- **Answer Faithfulness**: Verifies LLM doesn't hallucinate (target: > 94%)
- **Answer Relevancy**: Confirms answer is relevant to query (target: > 96%)
- **Contextual Precision**: Validates compression preserved critical info (target: > 92%)

**Resource Metrics:**
- **GPU VRAM Usage**: Memory required for DeepSeek-OCR (target: < 80%)
- **CPU Usage**: Processor utilization across nodes
- **Memory Usage**: System memory consumption
- **Compute Bottlenecks**: Identifies slowest components (SAM, DeepEncoder, CLIP)

### Dashboard Components

The dashboard consists of five main tabs:

1. **Overview**: High-level KPI summary with key metrics and trends
2. **Efficiency**: Detailed token compression, latency, and cost analysis
3. **Effectiveness**: OCR precision, answer quality, and relevancy metrics
4. **Resources**: GPU/CPU utilization and compute bottleneck analysis
5. **Deployment**: AKS and GKE cluster status and health monitoring

### Running the Dashboard

**Development Mode:**

```bash
cd ai-ocr-metrics-dashboard
pnpm install
pnpm dev
```

Access at `http://localhost:5173`

**Production Build:**

```bash
pnpm build
pnpm preview
```

### Integration with Data Sources

The dashboard currently uses mock data. To connect real data sources:

**Langfuse Integration** (for tracing and quality metrics):

```javascript
// In your backend
import { Langfuse } from "langfuse"

const langfuse = new Langfuse({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  secretKey: process.env.LANGFUSE_SECRET_KEY,
})

// Trace your pipeline
const trace = langfuse.trace({
  name: "ai-ocr-pipeline",
  userId: "user-123"
})

// Log OCR step
const ocrSpan = trace.span({
  name: "deepseek-ocr",
  startTime: new Date()
})

// Log LLM step
const llmSpan = trace.span({
  name: "llm-call",
  startTime: new Date()
})
```

**Binadox Integration** (for cost tracking):

```javascript
// Route API calls through TrueFoundry gateway
const response = await fetch('https://gateway.truefoundry.com/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.TRUEFOUNDRY_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'gpt-4',
    messages: [...],
    // Binadox automatically tracks costs
  })
})
```

**Prometheus Integration** (for resource metrics):

```javascript
// Expose Prometheus metrics
const prometheus = require('prom-client')

const gpuVramUsage = new prometheus.Gauge({
  name: 'gpu_vram_usage_percent',
  help: 'GPU VRAM usage percentage'
})

const cpuUsage = new prometheus.Gauge({
  name: 'cpu_usage_percent',
  help: 'CPU usage percentage'
})

// Update metrics periodically
setInterval(() => {
  gpuVramUsage.set(getCurrentGpuUsage())
  cpuUsage.set(getCurrentCpuUsage())
}, 5000)
```

## Troubleshooting

### Docker Issues

**Problem**: Docker daemon not running
```bash
# Solution: Start Docker service
sudo systemctl start docker
```

**Problem**: Permission denied when running docker commands
```bash
# Solution: Add user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

### Kubernetes Issues

**Problem**: Pods stuck in pending state
```bash
# Check pod events
kubectl describe pod <pod-name> -n ai-ocr

# Check node resources
kubectl top nodes
kubectl top pods -n ai-ocr
```

**Problem**: Service not accessible
```bash
# Verify service exists
kubectl get svc -n ai-ocr

# Check endpoints
kubectl get endpoints -n ai-ocr

# Test connectivity
kubectl run -it --rm debug --image=busybox --restart=Never -- sh
```

### CI/CD Pipeline Issues

**Problem**: GitHub Actions workflow failing
```bash
# Check workflow logs in GitHub UI
# Settings > Actions > All workflows > Select workflow > Latest run

# Common issues:
# - Missing secrets: Add in Settings > Secrets
# - Registry authentication: Verify credentials
# - Helm chart syntax: Run `helm lint ./helm/ai-ocr`
```

**Problem**: Azure DevOps pipeline not triggering
```bash
# Verify pipeline YAML syntax
# Check branch trigger configuration
# Ensure service connections are configured
# Review pipeline run history for error details
```

### ArgoCD Issues

**Problem**: Application out of sync
```bash
# Check sync status
argocd app get ai-ocr

# Manually trigger sync
argocd app sync ai-ocr

# Force sync (delete and recreate)
argocd app sync ai-ocr --force
```

**Problem**: ArgoCD cannot access Git repository
```bash
# Verify Git credentials
argocd repo list

# Update repository credentials
argocd repo add https://github.com/American-Blockchain/AI-OCR.git \
  --username <username> \
  --password <token>
```

### Dashboard Issues

**Problem**: Dashboard not loading metrics
```bash
# Check backend API is running
curl http://localhost:3000/api/metrics

# Verify CORS configuration
# Check browser console for API errors
# Ensure environment variables are set
```

**Problem**: Charts not rendering
```bash
# Verify Recharts is installed
npm list recharts

# Check browser console for JavaScript errors
# Ensure mock data format is correct
# Clear browser cache and reload
```

## Monitoring and Alerts

### Prometheus Metrics

Key metrics to monitor:

```yaml
# Application metrics
ai_ocr_compression_ratio           # Token compression ratio
ai_ocr_latency_ms                  # End-to-end latency
ai_ocr_cost_per_document           # Cost per document
ai_ocr_accuracy_percent            # OCR accuracy

# Infrastructure metrics
kubernetes_pod_cpu_usage           # Pod CPU usage
kubernetes_pod_memory_usage        # Pod memory usage
kubernetes_node_cpu_usage          # Node CPU usage
kubernetes_node_memory_usage       # Node memory usage
```

### Alert Rules

Configure alerts in Prometheus:

```yaml
groups:
  - name: ai-ocr-alerts
    rules:
      - alert: HighCompressionRatioDegradation
        expr: ai_ocr_compression_ratio < 3.5
        for: 5m
        annotations:
          summary: "Compression ratio below threshold"

      - alert: HighLatency
        expr: ai_ocr_latency_ms > 2000
        for: 5m
        annotations:
          summary: "End-to-end latency above threshold"

      - alert: HighCostPerDocument
        expr: ai_ocr_cost_per_document > 0.01
        for: 5m
        annotations:
          summary: "Cost per document above threshold"
```

## References

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Helm Documentation](https://helm.sh/docs/)
- [Azure AKS Documentation](https://docs.microsoft.com/en-us/azure/aks/)
- [Google Cloud GKE Documentation](https://cloud.google.com/kubernetes-engine/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Azure DevOps Documentation](https://docs.microsoft.com/en-us/azure/devops/)
- [ArgoCD Documentation](https://argo-cd.readthedocs.io/)
- [Recharts Documentation](https://recharts.org/)
- [Langfuse Documentation](https://langfuse.com/docs)
- [DeepSeek-OCR Paper](https://arxiv.org/abs/2406.06495)

