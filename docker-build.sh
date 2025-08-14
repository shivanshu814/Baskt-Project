#!/bin/bash

# Docker Build Script for Baskt Services
# Usage: ./docker-build.sh [service] [tag] [--push]

set -e

# Default values
DEFAULT_TAG="latest"
REGISTRY="baskt" # Change this to your registry if needed
PUSH=false

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

# Function to show usage
show_usage() {
    echo "Usage: $0 [service] [tag] [--push]"
    echo ""
    echo "Available services:"
    echo "  backend           - Build backend service"
    echo "  all              - Build all available services"
    echo ""
    echo "Options:"
    echo "  tag              - Docker image tag (default: latest)"
    echo "  --push           - Push image to registry after building"
    echo ""
    echo "Examples:"
    echo "  $0 backend                    # Build backend with 'latest' tag"
    echo "  $0 backend v1.0.0            # Build backend with 'v1.0.0' tag"
    echo "  $0 backend v1.0.0 --push     # Build and push backend"
    echo "  $0 all                       # Build all services"
}

# Function to build a service
build_service() {
    local service=$1
    local tag=$2
    local dockerfile_path="services/$service/Dockerfile"
    local image_name="$REGISTRY/$service:$tag"
    
    if [ ! -f "$dockerfile_path" ]; then
        print_error "Dockerfile not found at $dockerfile_path"
        return 1
    fi
    
    print_status "Building $service with tag $tag..."
    
    # First, build the JavaScript bundle outside Docker
    print_status "Building workspace packages..."
    if ! pnpm build:lib; then
        print_error "Failed to build workspace packages"
        return 1
    fi
    
    print_status "Building $service JavaScript bundle..."
    if ! (cd "services/$service" && pnpm build); then
        print_error "Failed to build $service bundle"
        return 1
    fi
    
    # Verify the built file exists
    if [ ! -f "services/$service/dist/server/index.js" ]; then
        print_error "Built JavaScript file not found at services/$service/dist/server/index.js"
        return 1
    fi
    
    print_status "JavaScript bundle ready. Building Docker image..."
    
    # Build the Docker image (which only copies the pre-built file)
    docker build \
        -f "$dockerfile_path" \
        -t "$image_name" \
        --build-arg BUILD_DATE="$(date -u +'%Y-%m-%dT%H:%M:%SZ')" \
        --build-arg VERSION="$tag" \
        .
    
    if [ $? -eq 0 ]; then
        print_success "Successfully built $image_name"
        
        # Also tag as latest if not already latest
        if [ "$tag" != "latest" ]; then
            docker tag "$image_name" "$REGISTRY/$service:latest"
            print_status "Also tagged as $REGISTRY/$service:latest"
        fi
        
        # Push if requested
        if [ "$PUSH" = true ]; then
            print_status "Pushing $image_name..."
            docker push "$image_name"
            
            if [ "$tag" != "latest" ]; then
                docker push "$REGISTRY/$service:latest"
            fi
            
            print_success "Successfully pushed $image_name"
        fi
        
        return 0
    else
        print_error "Failed to build Docker image for $service"
        return 1
    fi
}

# Function to build all services
build_all() {
    local tag=$1
    local services=("backend")
    local failed_services=()
    
    print_status "Building all services with tag $tag..."
    
    for service in "${services[@]}"; do
        if ! build_service "$service" "$tag"; then
            failed_services+=("$service")
        fi
        echo "" # Add spacing between builds
    done
    
    # Report results
    if [ ${#failed_services[@]} -eq 0 ]; then
        print_success "All services built successfully!"
    else
        print_error "Failed to build the following services: ${failed_services[*]}"
        return 1
    fi
}

# Main script logic
main() {
    # Check if Docker is running
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    
    # Parse arguments
    SERVICE=""
    TAG="$DEFAULT_TAG"
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --push)
                PUSH=true
                shift
                ;;
            --help|-h)
                show_usage
                exit 0
                ;;
            *)
                if [ -z "$SERVICE" ]; then
                    SERVICE=$1
                elif [ -z "$TAG" ] || [ "$TAG" = "$DEFAULT_TAG" ]; then
                    TAG=$1
                fi
                shift
                ;;
        esac
    done
    
    # Show usage if no service specified
    if [ -z "$SERVICE" ]; then
        show_usage
        exit 1
    fi
    
    print_status "Docker Build Configuration:"
    print_status "  Service: $SERVICE"
    print_status "  Tag: $TAG"
    print_status "  Registry: $REGISTRY"
    print_status "  Push: $PUSH"
    echo ""
    
    # Build based on service
    case $SERVICE in
        backend)
            build_service "backend" "$TAG"
            ;;
        all)
            build_all "$TAG"
            ;;
        *)
            print_error "Unknown service: $SERVICE"
            show_usage
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
