# Memoria Eterna - Kubernetes Setup Guide

## 📋 Overview

Complete Kubernetes deployment for Memoria Eterna with microservices architecture, monitoring, and enterprise features.

## 🏗️ Architecture

### Namespaces
- **`memoria-eterna`**: Main application
- **`memoria-eterna-monitoring`**: Monitoring stack

### Components
- **Frontend**: Next.js (3 replicas)
- **API Gateway**: Load balancer (3 replicas)
- **Microservices**: Auth, Memories, Media, Notifications, Payments
- **Database**: PostgreSQL (StatefulSet), Redis
- **Monitoring**: Prometheus, Grafana (optional)

## 🚀 Quick Start

### Prerequisites
```bash
# Check cluster access
kubectl cluster-info
kubectl get nodes
```

### Deployment
```bash
# Make scripts executable
chmod +x k8s/scripts/*.sh

# Deploy application
./k8s/scripts/deploy.sh

# Deploy with monitoring
./k8s/scripts/deploy.sh --with-monitoring

# Check status
./k8s/scripts/status.sh
```

## 📁 File Structure
```
k8s/
├── namespace.yaml                    # Namespaces
├── configmaps/app-config.yaml       # App configuration
├── secrets/app-secrets.yaml         # Secrets (base64 encoded)
├── services/database.yaml           # Database services
├── deployments/                     # All deployments
├── ingress/ingress.yaml            # External access
├── monitoring/                      # Prometheus & Grafana
└── scripts/                        # Management scripts
```

## ⚙️ Configuration

### Update Configuration
1. **`k8s/configmaps/app-config.yaml`**: Environment variables
2. **`k8s/secrets/app-secrets.yaml`**: Secrets (base64 encoded)
3. **`k8s/ingress/ingress.yaml`**: Domain names

### Base64 Encoding
```bash
echo -n "your-secret" | base64
```

## 🔧 Management

### Scripts
```bash
# Deploy
./k8s/scripts/deploy.sh [--with-monitoring]

# Check status
./k8s/scripts/status.sh

# Clean up
./k8s/scripts/cleanup.sh
```

### Manual Commands
```bash
# View resources
kubectl get all -n memoria-eterna

# Check pods
kubectl get pods -n memoria-eterna

# View logs
kubectl logs -f deployment/api-gateway -n memoria-eterna

# Port forwarding
kubectl port-forward service/frontend-service 3000:80 -n memoria-eterna
```

## 📊 Monitoring

### Access Monitoring
```bash
# Port forward monitoring services
kubectl port-forward service/prometheus-service 9090:9090 -n memoria-eterna-monitoring
kubectl port-forward service/grafana-service 3001:80 -n memoria-eterna-monitoring
```

### Grafana
- **URL**: `http://localhost:3001`
- **Credentials**: admin/admin123
- **Dashboards**: Pre-configured Memoria Eterna overview

## 🚨 Troubleshooting

### Common Issues
```bash
# Pod issues
kubectl describe pod <pod-name> -n memoria-eterna

# Service issues
kubectl get endpoints -n memoria-eterna

# PVC issues
kubectl get pvc -n memoria-eterna

# Ingress issues
kubectl describe ingress memoria-eterna-ingress -n memoria-eterna
```

### Health Checks
```bash
# Check pod health
kubectl get pods -n memoria-eterna -o wide

# Test service connectivity
kubectl run test-connection --image=busybox --rm -i --restart=Never -n memoria-eterna -- wget -qO- api-gateway-service:80/health
```

## 🔒 Security

### Secrets Management
- All secrets stored in Kubernetes secrets
- Base64 encoded for storage
- Mounted as environment variables

### Network Security
- Services use ClusterIP (internal only)
- Ingress provides external access with SSL
- CORS configured for web apps

## 📈 Scaling

### Horizontal Pod Autoscaling
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-gateway-hpa
  namespace: memoria-eterna
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-gateway
  minReplicas: 3
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70
```

### Resource Limits
- **CPU**: 250m - 1000m per pod
- **Memory**: 256Mi - 2Gi per pod

## 🔄 Updates

### Rolling Updates
```bash
# Update deployment
kubectl set image deployment/api-gateway api-gateway=memoria-eterna/api-gateway:v2.0.0 -n memoria-eterna

# Monitor rollout
kubectl rollout status deployment/api-gateway -n memoria-eterna

# Rollback
kubectl rollout undo deployment/api-gateway -n memoria-eterna
```

## 🌐 Production Setup

### SSL/TLS
1. Install cert-manager
2. Configure ClusterIssuer for Let's Encrypt
3. Update ingress annotations

### Load Balancing
- Cloud Load Balancer (AWS ALB, GCP LB, Azure AG)
- CDN (Cloudflare, AWS CloudFront)
- Service Mesh (Istio)

### Monitoring
- AlertManager for notifications
- Log aggregation (ELK stack)
- Grafana alerts
- Custom dashboards

## 📚 Resources
- [Kubernetes Docs](https://kubernetes.io/docs/)
- [Prometheus Docs](https://prometheus.io/docs/)
- [Grafana Docs](https://grafana.com/docs/)

---

**Note**: Customize for your specific requirements, security policies, and infrastructure.
