#!/bin/bash

# Memoria Eterna Kubernetes Cleanup Script
# This script removes all resources from Kubernetes

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

# Function to confirm deletion
confirm_deletion() {
    echo
    print_warning "This will delete ALL Memoria Eterna resources from Kubernetes!"
    echo "This includes:"
    echo "  - All pods, services, deployments"
    echo "  - All persistent volumes and data"
    echo "  - All secrets and configmaps"
    echo "  - All namespaces"
    echo
    read -p "Are you sure you want to continue? (yes/no): " -r
    echo
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        print_status "Cleanup cancelled"
        exit 0
    fi
}

# Function to delete resources
delete_resources() {
    local namespace=$1
    local resource_type=$2
    local label_selector=$3
    
    print_status "Deleting $resource_type in namespace $namespace..."
    
    if kubectl get "$resource_type" -n "$namespace" -l "$label_selector" &> /dev/null; then
        if kubectl delete "$resource_type" -n "$namespace" -l "$label_selector" --ignore-not-found=true; then
            print_success "Deleted $resource_type in $namespace"
        else
            print_warning "Failed to delete some $resource_type in $namespace"
        fi
    else
        print_status "No $resource_type found in $namespace"
    fi
}

# Function to delete namespace
delete_namespace() {
    local namespace=$1
    
    print_status "Deleting namespace $namespace..."
    
    if kubectl get namespace "$namespace" &> /dev/null; then
        if kubectl delete namespace "$namespace" --ignore-not-found=true; then
            print_success "Deleted namespace $namespace"
        else
            print_warning "Failed to delete namespace $namespace"
        fi
    else
        print_status "Namespace $namespace not found"
    fi
}

# Function to wait for namespace deletion
wait_for_namespace_deletion() {
    local namespace=$1
    local timeout=${2:-300} # Default 5 minutes
    
    print_status "Waiting for namespace $namespace to be deleted..."
    
    local elapsed=0
    while [ $elapsed -lt $timeout ]; do
        if ! kubectl get namespace "$namespace" &> /dev/null; then
            print_success "Namespace $namespace deleted successfully"
            return 0
        fi
        sleep 5
        elapsed=$((elapsed + 5))
    done
    
    print_warning "Timeout waiting for namespace $namespace to be deleted"
    return 1
}

# Main cleanup function
main() {
    print_status "Starting Memoria Eterna Kubernetes cleanup..."
    
    # Check prerequisites
    check_kubectl
    
    # Confirm deletion
    confirm_deletion
    
    # Delete resources in memoria-eterna namespace
    print_status "Cleaning up memoria-eterna namespace..."
    
    # Delete deployments
    delete_resources "memoria-eterna" "deployment" "app"
    delete_resources "memoria-eterna" "deployment" "component"
    
    # Delete services
    delete_resources "memoria-eterna" "service" "app"
    delete_resources "memoria-eterna" "service" "component"
    
    # Delete statefulsets
    delete_resources "memoria-eterna" "statefulset" "app"
    delete_resources "memoria-eterna" "statefulset" "component"
    
    # Delete persistent volume claims
    delete_resources "memoria-eterna" "pvc" "app"
    delete_resources "memoria-eterna" "pvc" "component"
    
    # Delete configmaps
    delete_resources "memoria-eterna" "configmap" "app"
    delete_resources "memoria-eterna" "configmap" "component"
    
    # Delete secrets
    delete_resources "memoria-eterna" "secret" "app"
    delete_resources "memoria-eterna" "secret" "component"
    
    # Delete ingress
    delete_resources "memoria-eterna" "ingress" "app"
    delete_resources "memoria-eterna" "ingress" "component"
    
    # Delete any remaining pods
    delete_resources "memoria-eterna" "pod" "app"
    delete_resources "memoria-eterna" "pod" "component"
    
    # Delete resources in memoria-eterna-monitoring namespace
    print_status "Cleaning up memoria-eterna-monitoring namespace..."
    
    # Delete deployments
    delete_resources "memoria-eterna-monitoring" "deployment" "app"
    delete_resources "memoria-eterna-monitoring" "deployment" "component"
    
    # Delete services
    delete_resources "memoria-eterna-monitoring" "service" "app"
    delete_resources "memoria-eterna-monitoring" "service" "component"
    
    # Delete persistent volume claims
    delete_resources "memoria-eterna-monitoring" "pvc" "app"
    delete_resources "memoria-eterna-monitoring" "pvc" "component"
    
    # Delete configmaps
    delete_resources "memoria-eterna-monitoring" "configmap" "app"
    delete_resources "memoria-eterna-monitoring" "configmap" "component"
    
    # Delete secrets
    delete_resources "memoria-eterna-monitoring" "secret" "app"
    delete_resources "memoria-eterna-monitoring" "secret" "component"
    
    # Delete ingress
    delete_resources "memoria-eterna-monitoring" "ingress" "app"
    delete_resources "memoria-eterna-monitoring" "ingress" "component"
    
    # Delete any remaining pods
    delete_resources "memoria-eterna-monitoring" "pod" "app"
    delete_resources "memoria-eterna-monitoring" "pod" "component"
    
    # Delete namespaces
    print_status "Deleting namespaces..."
    delete_namespace "memoria-eterna"
    delete_namespace "memoria-eterna-monitoring"
    
    # Wait for namespace deletion
    wait_for_namespace_deletion "memoria-eterna"
    wait_for_namespace_deletion "memoria-eterna-monitoring"
    
    # Clean up any orphaned persistent volumes
    print_status "Checking for orphaned persistent volumes..."
    if kubectl get pv | grep -q "memoria-eterna"; then
        print_warning "Found orphaned persistent volumes. You may want to delete them manually:"
        kubectl get pv | grep "memoria-eterna"
        echo
        echo "To delete them, run:"
        echo "kubectl delete pv <volume-name>"
    fi
    
    print_success "Cleanup completed successfully!"
    echo
    print_status "Cleanup Summary:"
    echo "  - Deleted all deployments, services, and pods"
    echo "  - Deleted all persistent volume claims"
    echo "  - Deleted all configmaps and secrets"
    echo "  - Deleted all ingress configurations"
    echo "  - Deleted namespaces: memoria-eterna, memoria-eterna-monitoring"
    echo
    print_warning "Note: Persistent volumes may still exist and need manual cleanup"
}

# Help function
show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo
    echo "Options:"
    echo "  --help              Show this help message"
    echo
    echo "This script will delete ALL Memoria Eterna resources from Kubernetes."
    echo "Use with caution as this action cannot be undone!"
}

# Parse command line arguments
case "${1:-}" in
    --help)
        show_help
        exit 0
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
