#!/bin/bash

# Memoria Eterna Kubernetes Deployment Script
# This script deploys the complete infrastructure to Kubernetes

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if kubectl is available
check_kubectl() {
    if ! command -v kubectl &> /dev/null; then
        print_error "kubectl is not installed or not in PATH"
        exit 1
    fi
    print_success "kubectl found"
}

# Function to check if namespace exists
check_namespace() {
    local namespace=$1
    if kubectl get namespace "$namespace" &> /dev/null; then
        print_warning "Namespace $namespace already exists"
    else
        print_status "Creating namespace $namespace"
        kubectl apply -f k8s/namespace.yaml
    fi
}

# Function to apply configurations
apply_config() {
    local config_path=$1
    local description=$2
    
    print_status "Applying $description..."
    if kubectl apply -f "$config_path"; then
        print_success "$description applied successfully"
    else
        print_error "Failed to apply $description"
        exit 1
    fi
}

# Function to wait for pods to be ready
wait_for_pods() {
    local namespace=$1
    local label_selector=$2
    local timeout=${3:-300} # Default 5 minutes
    
    print_status "Waiting for pods in namespace $namespace with selector $label_selector..."
    
    if kubectl wait --for=condition=ready pod -l "$label_selector" -n "$namespace" --timeout="${timeout}s"; then
        print_success "All pods are ready"
    else
        print_error "Timeout waiting for pods to be ready"
        kubectl get pods -n "$namespace" -l "$label_selector"
        exit 1
    fi
}

# Function to check service health
check_service_health() {
    local namespace=$1
    local service_name=$2
    local port=$3
    
    print_status "Checking health of service $service_name..."
    
    # Wait a bit for service to be ready
    sleep 10
    
    # Try to connect to the service
    if kubectl run test-connection --image=busybox --rm -i --restart=Never -n "$namespace" -- \
        wget -qO- "$service_name:$port/health" 2>/dev/null || \
        kubectl run test-connection --image=busybox --rm -i --restart=Never -n "$namespace" -- \
        wget -qO- "$service_name:$port" 2>/dev/null; then
        print_success "Service $service_name is responding"
    else
        print_warning "Service $service_name health check failed (this might be normal during initial deployment)"
    fi
}

# Main deployment function
main() {
    print_status "Starting Memoria Eterna Kubernetes deployment..."
    
    # Check prerequisites
    check_kubectl
    
    # Create namespaces
    check_namespace "memoria-eterna"
    check_namespace "memoria-eterna-monitoring"
    
    # Apply configurations in order
    print_status "Applying base configurations..."
    
    # 1. Secrets and ConfigMaps
    apply_config "k8s/secrets/app-secrets.yaml" "Application Secrets"
    apply_config "k8s/configmaps/app-config.yaml" "Application ConfigMap"
    
    # 2. Database services
    apply_config "k8s/services/database.yaml" "Database Services"
    
    # Wait for database to be ready
    print_status "Waiting for database services to be ready..."
    sleep 30
    wait_for_pods "memoria-eterna" "app=postgres" 120
    wait_for_pods "memoria-eterna" "app=redis" 60
    
    # 3. Microservices
    apply_config "k8s/deployments/microservices.yaml" "Microservices"
    
    # 4. API Gateway
    apply_config "k8s/deployments/api-gateway.yaml" "API Gateway"
    
    # 5. Frontend
    apply_config "k8s/deployments/frontend.yaml" "Frontend"
    
    # 6. Ingress
    apply_config "k8s/ingress/ingress.yaml" "Ingress Configuration"
    
    # 7. Monitoring (optional)
    if [ "$1" = "--with-monitoring" ]; then
        print_status "Deploying monitoring stack..."
        apply_config "k8s/monitoring/prometheus.yaml" "Prometheus"
        apply_config "k8s/monitoring/grafana.yaml" "Grafana"
        
        # Wait for monitoring services
        wait_for_pods "memoria-eterna-monitoring" "app=prometheus" 120
        wait_for_pods "memoria-eterna-monitoring" "app=grafana" 120
    fi
    
    # Wait for main services to be ready
    print_status "Waiting for main services to be ready..."
    wait_for_pods "memoria-eterna" "app=api-gateway" 180
    wait_for_pods "memoria-eterna" "app=frontend" 180
    
    # Health checks
    print_status "Performing health checks..."
    check_service_health "memoria-eterna" "api-gateway-service" "80"
    check_service_health "memoria-eterna" "frontend-service" "80"
    
    # Display deployment information
    print_success "Deployment completed successfully!"
    echo
    print_status "Deployment Summary:"
    echo "  - Namespaces: memoria-eterna, memoria-eterna-monitoring"
    echo "  - Database: PostgreSQL, Redis"
    echo "  - Microservices: Auth, Memories, Media, Notifications, Payments"
    echo "  - API Gateway: Load balancer and routing"
    echo "  - Frontend: Next.js application"
    echo "  - Ingress: External access configuration"
    if [ "$1" = "--with-monitoring" ]; then
        echo "  - Monitoring: Prometheus, Grafana"
    fi
    echo
    print_status "Useful commands:"
    echo "  kubectl get pods -n memoria-eterna"
    echo "  kubectl get services -n memoria-eterna"
    echo "  kubectl logs -f deployment/api-gateway -n memoria-eterna"
    echo "  kubectl port-forward service/frontend-service 3000:80 -n memoria-eterna"
    echo
    print_warning "Remember to:"
    echo "  1. Update your DNS to point to your cluster's external IP"
    echo "  2. Configure SSL certificates with cert-manager"
    echo "  3. Update environment variables with real values"
    echo "  4. Set up monitoring alerts if needed"
}

# Help function
show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo
    echo "Options:"
    echo "  --with-monitoring    Deploy with monitoring stack (Prometheus + Grafana)"
    echo "  --help              Show this help message"
    echo
    echo "Examples:"
    echo "  $0                    Deploy without monitoring"
    echo "  $0 --with-monitoring  Deploy with monitoring stack"
}

# Parse command line arguments
case "${1:-}" in
    --help)
        show_help
        exit 0
        ;;
    --with-monitoring)
        main "$1"
        ;;
    "")
        main
        ;;
    *)
        print_error "Unknown option: $1"
        show_help
        exit 1
        ;;
esac
