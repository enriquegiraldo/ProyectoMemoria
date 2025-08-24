#!/bin/bash

# Memoria Eterna Kubernetes Status Script
# This script checks the status of all resources

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

# Function to check namespace status
check_namespace_status() {
    local namespace=$1
    
    echo
    print_status "=== Namespace: $namespace ==="
    
    if kubectl get namespace "$namespace" &> /dev/null; then
        print_success "Namespace $namespace exists"
        
        # Check pods
        echo
        print_status "Pods in $namespace:"
        if kubectl get pods -n "$namespace" 2>/dev/null | grep -q .; then
            kubectl get pods -n "$namespace"
        else
            print_warning "No pods found in $namespace"
        fi
        
        # Check services
        echo
        print_status "Services in $namespace:"
        if kubectl get services -n "$namespace" 2>/dev/null | grep -q .; then
            kubectl get services -n "$namespace"
        else
            print_warning "No services found in $namespace"
        fi
        
        # Check deployments
        echo
        print_status "Deployments in $namespace:"
        if kubectl get deployments -n "$namespace" 2>/dev/null | grep -q .; then
            kubectl get deployments -n "$namespace"
        else
            print_warning "No deployments found in $namespace"
        fi
        
        # Check statefulsets
        echo
        print_status "StatefulSets in $namespace:"
        if kubectl get statefulsets -n "$namespace" 2>/dev/null | grep -q .; then
            kubectl get statefulsets -n "$namespace"
        else
            print_warning "No statefulsets found in $namespace"
        fi
        
        # Check persistent volume claims
        echo
        print_status "Persistent Volume Claims in $namespace:"
        if kubectl get pvc -n "$namespace" 2>/dev/null | grep -q .; then
            kubectl get pvc -n "$namespace"
        else
            print_warning "No PVCs found in $namespace"
        fi
        
        # Check ingress
        echo
        print_status "Ingress in $namespace:"
        if kubectl get ingress -n "$namespace" 2>/dev/null | grep -q .; then
            kubectl get ingress -n "$namespace"
        else
            print_warning "No ingress found in $namespace"
        fi
        
    else
        print_error "Namespace $namespace does not exist"
    fi
}

# Function to check pod health
check_pod_health() {
    local namespace=$1
    
    echo
    print_status "=== Pod Health Check: $namespace ==="
    
    if ! kubectl get namespace "$namespace" &> /dev/null; then
        print_error "Namespace $namespace does not exist"
        return
    fi
    
    local unhealthy_pods=0
    local total_pods=0
    
    while IFS= read -r line; do
        if [[ $line =~ ^[a-zA-Z0-9-]+ ]]; then
            total_pods=$((total_pods + 1))
            pod_name=$(echo "$line" | awk '{print $1}')
            status=$(echo "$line" | awk '{print $3}')
            ready=$(echo "$line" | awk '{print $2}')
            
            if [[ "$status" == "Running" && "$ready" =~ ^[0-9]+/[0-9]+$ ]]; then
                ready_parts=(${ready//\// })
                if [[ ${ready_parts[0]} -eq ${ready_parts[1]} ]]; then
                    print_success "Pod $pod_name: $status ($ready)"
                else
                    print_warning "Pod $pod_name: $status ($ready) - Not all containers ready"
                    unhealthy_pods=$((unhealthy_pods + 1))
                fi
            elif [[ "$status" == "Pending" ]]; then
                print_warning "Pod $pod_name: $status - Pending"
                unhealthy_pods=$((unhealthy_pods + 1))
            elif [[ "$status" == "Failed" || "$status" == "Error" ]]; then
                print_error "Pod $pod_name: $status - Failed"
                unhealthy_pods=$((unhealthy_pods + 1))
            else
                print_warning "Pod $pod_name: $status ($ready) - Unknown status"
                unhealthy_pods=$((unhealthy_pods + 1))
            fi
        fi
    done < <(kubectl get pods -n "$namespace" 2>/dev/null | tail -n +2)
    
    if [[ $total_pods -eq 0 ]]; then
        print_warning "No pods found in namespace $namespace"
    else
        echo
        if [[ $unhealthy_pods -eq 0 ]]; then
            print_success "All $total_pods pods are healthy in $namespace"
        else
            print_warning "$unhealthy_pods out of $total_pods pods have issues in $namespace"
        fi
    fi
}

# Function to check service endpoints
check_service_endpoints() {
    local namespace=$1
    
    echo
    print_status "=== Service Endpoints: $namespace ==="
    
    if ! kubectl get namespace "$namespace" &> /dev/null; then
        print_error "Namespace $namespace does not exist"
        return
    fi
    
    while IFS= read -r line; do
        if [[ $line =~ ^[a-zA-Z0-9-]+ ]]; then
            service_name=$(echo "$line" | awk '{print $1}')
            service_type=$(echo "$line" | awk '{print $2}')
            cluster_ip=$(echo "$line" | awk '{print $3}')
            external_ip=$(echo "$line" | awk '{print $4}')
            
            echo
            print_status "Service: $service_name ($service_type)"
            echo "  Cluster IP: $cluster_ip"
            if [[ "$external_ip" != "<none>" ]]; then
                echo "  External IP: $external_ip"
            fi
            
            # Check endpoints
            if kubectl get endpoints "$service_name" -n "$namespace" &> /dev/null; then
                endpoints=$(kubectl get endpoints "$service_name" -n "$namespace" -o jsonpath='{.subsets[*].addresses[*].ip}' 2>/dev/null)
                if [[ -n "$endpoints" ]]; then
                    print_success "  Endpoints: $endpoints"
                else
                    print_warning "  No endpoints available"
                fi
            else
                print_warning "  No endpoints found"
            fi
        fi
    done < <(kubectl get services -n "$namespace" 2>/dev/null | tail -n +2)
}

# Function to check resource usage
check_resource_usage() {
    local namespace=$1
    
    echo
    print_status "=== Resource Usage: $namespace ==="
    
    if ! kubectl get namespace "$namespace" &> /dev/null; then
        print_error "Namespace $namespace does not exist"
        return
    fi
    
    # Check if metrics-server is available
    if kubectl top nodes &> /dev/null 2>&1; then
        echo
        print_status "Pod resource usage:"
        if kubectl top pods -n "$namespace" 2>/dev/null | grep -q .; then
            kubectl top pods -n "$namespace"
        else
            print_warning "No resource usage data available"
        fi
    else
        print_warning "Metrics server not available - resource usage not shown"
    fi
}

# Function to check logs for errors
check_logs_for_errors() {
    local namespace=$1
    local max_lines=${2:-50}
    
    echo
    print_status "=== Recent Error Logs: $namespace ==="
    
    if ! kubectl get namespace "$namespace" &> /dev/null; then
        print_error "Namespace $namespace does not exist"
        return
    fi
    
    local found_errors=false
    
    while IFS= read -r pod_name; do
        if [[ -n "$pod_name" ]]; then
            # Check for error logs in the pod
            error_logs=$(kubectl logs "$pod_name" -n "$namespace" --tail="$max_lines" 2>/dev/null | grep -i "error\|exception\|failed\|fatal" | tail -5)
            if [[ -n "$error_logs" ]]; then
                found_errors=true
                echo
                print_warning "Errors in pod $pod_name:"
                echo "$error_logs"
            fi
        fi
    done < <(kubectl get pods -n "$namespace" -o jsonpath='{.items[*].metadata.name}' 2>/dev/null)
    
    if [[ "$found_errors" == false ]]; then
        print_success "No recent errors found in $namespace"
    fi
}

# Function to check cluster info
check_cluster_info() {
    echo
    print_status "=== Cluster Information ==="
    
    echo
    print_status "Cluster version:"
    kubectl version --short 2>/dev/null || print_warning "Could not get cluster version"
    
    echo
    print_status "Cluster nodes:"
    if kubectl get nodes 2>/dev/null | grep -q .; then
        kubectl get nodes
    else
        print_warning "Could not get cluster nodes"
    fi
    
    echo
    print_status "Namespaces:"
    if kubectl get namespaces 2>/dev/null | grep -q .; then
        kubectl get namespaces
    else
        print_warning "Could not get namespaces"
    fi
}

# Main status function
main() {
    print_status "Checking Memoria Eterna Kubernetes status..."
    
    # Check prerequisites
    check_kubectl
    
    # Check cluster info
    check_cluster_info
    
    # Check main namespace
    check_namespace_status "memoria-eterna"
    check_pod_health "memoria-eterna"
    check_service_endpoints "memoria-eterna"
    check_resource_usage "memoria-eterna"
    check_logs_for_errors "memoria-eterna"
    
    # Check monitoring namespace
    check_namespace_status "memoria-eterna-monitoring"
    check_pod_health "memoria-eterna-monitoring"
    check_service_endpoints "memoria-eterna-monitoring"
    check_resource_usage "memoria-eterna-monitoring"
    check_logs_for_errors "memoria-eterna-monitoring"
    
    echo
    print_success "Status check completed!"
    echo
    print_status "Useful commands for troubleshooting:"
    echo "  kubectl describe pod <pod-name> -n memoria-eterna"
    echo "  kubectl logs <pod-name> -n memoria-eterna"
    echo "  kubectl exec -it <pod-name> -n memoria-eterna -- /bin/bash"
    echo "  kubectl port-forward service/<service-name> <local-port>:<service-port> -n memoria-eterna"
}

# Help function
show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo
    echo "Options:"
    echo "  --help              Show this help message"
    echo
    echo "This script checks the status of all Memoria Eterna Kubernetes resources."
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
