#!/bin/bash

# Production Testing Script
# This script runs comprehensive tests against the production deployment

set -e

echo "🚀 Starting Production Testing Suite"

# Configuration
PRODUCTION_URL=${1:-"https://your-app.vercel.app"}
TEST_TIMEOUT=30000
CONCURRENT_USERS=10

echo "Testing URL: $PRODUCTION_URL"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    case $status in
        "SUCCESS")
            echo -e "${GREEN}✅ $message${NC}"
            ;;
        "ERROR")
            echo -e "${RED}❌ $message${NC}"
            ;;
        "WARNING")
            echo -e "${YELLOW}⚠️ $message${NC}"
            ;;
        "INFO")
            echo -e "ℹ️ $message"
            ;;
    esac
}

# Function to check if URL is accessible
check_url() {
    local url=$1
    local expected_status=${2:-200}
    
    print_status "INFO" "Checking $url"
    
    local status_code=$(curl -s -o /dev/null -w "%{http_code}" "$url" || echo "000")
    
    if [ "$status_code" = "$expected_status" ]; then
        print_status "SUCCESS" "$url returned $status_code"
        return 0
    else
        print_status "ERROR" "$url returned $status_code (expected $expected_status)"
        return 1
    fi
}

# Function to check response time
check_response_time() {
    local url=$1
    local max_time=${2:-2000} # 2 seconds default
    
    print_status "INFO" "Checking response time for $url"
    
    local response_time=$(curl -s -o /dev/null -w "%{time_total}" "$url" | awk '{print int($1*1000)}')
    
    if [ "$response_time" -le "$max_time" ]; then
        print_status "SUCCESS" "$url responded in ${response_time}ms"
        return 0
    else
        print_status "ERROR" "$url took ${response_time}ms (max: ${max_time}ms)"
        return 1
    fi
}

# Function to check API endpoints
test_api_endpoints() {
    print_status "INFO" "Testing API endpoints..."
    
    local endpoints=(
        "/api/health"
        "/api/auth/session"
    )
    
    for endpoint in "${endpoints[@]}"; do
        check_url "$PRODUCTION_URL$endpoint" || return 1
    done
    
    print_status "SUCCESS" "All API endpoints accessible"
}

# Function to test page load times
test_page_performance() {
    print_status "INFO" "Testing page performance..."
    
    local pages=(
        "/"
        "/auth"
        "/game"
        "/leaderboard"
    )
    
    for page in "${pages[@]}"; do
        check_response_time "$PRODUCTION_URL$page" 3000 || return 1
    done
    
    print_status "SUCCESS" "All pages meet performance requirements"
}

# Function to test mobile responsiveness
test_mobile_responsiveness() {
    print_status "INFO" "Testing mobile responsiveness..."
    
    # Use Playwright to test mobile viewports
    if command -v npx &> /dev/null; then
        npx playwright test --project="Mobile Chrome" --grep="mobile" || return 1
        print_status "SUCCESS" "Mobile responsiveness tests passed"
    else
        print_status "WARNING" "Playwright not available, skipping mobile tests"
    fi
}

# Function to run load tests
run_load_tests() {
    print_status "INFO" "Running load tests..."
    
    # Simple load test using curl
    local success_count=0
    local total_requests=$CONCURRENT_USERS
    
    for i in $(seq 1 $total_requests); do
        if curl -s -f "$PRODUCTION_URL" > /dev/null; then
            ((success_count++))
        fi &
    done
    
    wait # Wait for all background processes
    
    local success_rate=$((success_count * 100 / total_requests))
    
    if [ "$success_rate" -ge 95 ]; then
        print_status "SUCCESS" "Load test passed: $success_rate% success rate"
    else
        print_status "ERROR" "Load test failed: $success_rate% success rate"
        return 1
    fi
}

# Function to test security headers
test_security_headers() {
    print_status "INFO" "Testing security headers..."
    
    local headers=$(curl -s -I "$PRODUCTION_URL")
    
    local required_headers=(
        "X-Content-Type-Options"
        "X-Frame-Options"
        "X-XSS-Protection"
        "Strict-Transport-Security"
    )
    
    for header in "${required_headers[@]}"; do
        if echo "$headers" | grep -i "$header" > /dev/null; then
            print_status "SUCCESS" "$header header present"
        else
            print_status "ERROR" "$header header missing"
            return 1
        fi
    done
    
    print_status "SUCCESS" "All security headers present"
}

# Function to test PWA functionality
test_pwa_functionality() {
    print_status "INFO" "Testing PWA functionality..."
    
    # Check for manifest
    check_url "$PRODUCTION_URL/manifest.json" || return 1
    
    # Check for service worker
    local sw_response=$(curl -s "$PRODUCTION_URL/sw.js" | head -1)
    if [[ "$sw_response" == *"self"* ]] || [[ "$sw_response" == *"workbox"* ]]; then
        print_status "SUCCESS" "Service worker found"
    else
        print_status "ERROR" "Service worker not found or invalid"
        return 1
    fi
    
    print_status "SUCCESS" "PWA functionality verified"
}

# Function to test database connectivity
test_database_connectivity() {
    print_status "INFO" "Testing database connectivity..."
    
    # Test health endpoint that checks database
    local health_response=$(curl -s "$PRODUCTION_URL/api/health")
    
    if echo "$health_response" | grep -q "healthy"; then
        print_status "SUCCESS" "Database connectivity verified"
    else
        print_status "ERROR" "Database connectivity issues detected"
        return 1
    fi
}

# Function to run Lighthouse audit
run_lighthouse_audit() {
    print_status "INFO" "Running Lighthouse audit..."
    
    if command -v lighthouse &> /dev/null; then
        lighthouse "$PRODUCTION_URL" \
            --output=json \
            --output-path=./lighthouse-report.json \
            --chrome-flags="--headless --no-sandbox" \
            --quiet
        
        # Parse results
        local performance=$(cat lighthouse-report.json | jq '.categories.performance.score * 100')
        local accessibility=$(cat lighthouse-report.json | jq '.categories.accessibility.score * 100')
        local best_practices=$(cat lighthouse-report.json | jq '.categories["best-practices"].score * 100')
        local seo=$(cat lighthouse-report.json | jq '.categories.seo.score * 100')
        
        print_status "INFO" "Lighthouse Scores:"
        print_status "INFO" "  Performance: ${performance}%"
        print_status "INFO" "  Accessibility: ${accessibility}%"
        print_status "INFO" "  Best Practices: ${best_practices}%"
        print_status "INFO" "  SEO: ${seo}%"
        
        # Check if scores meet thresholds
        if (( $(echo "$performance >= 80" | bc -l) )) && \
           (( $(echo "$accessibility >= 90" | bc -l) )) && \
           (( $(echo "$best_practices >= 90" | bc -l) )) && \
           (( $(echo "$seo >= 90" | bc -l) )); then
            print_status "SUCCESS" "Lighthouse audit passed"
        else
            print_status "ERROR" "Lighthouse audit failed to meet thresholds"
            return 1
        fi
    else
        print_status "WARNING" "Lighthouse not available, skipping audit"
    fi
}

# Main test execution
main() {
    print_status "INFO" "Starting production tests for $PRODUCTION_URL"
    
    local failed_tests=0
    
    # Run all tests
    test_api_endpoints || ((failed_tests++))
    test_page_performance || ((failed_tests++))
    test_security_headers || ((failed_tests++))
    test_database_connectivity || ((failed_tests++))
    test_pwa_functionality || ((failed_tests++))
    run_load_tests || ((failed_tests++))
    test_mobile_responsiveness || ((failed_tests++))
    run_lighthouse_audit || ((failed_tests++))
    
    # Summary
    echo ""
    print_status "INFO" "Test Summary:"
    
    if [ $failed_tests -eq 0 ]; then
        print_status "SUCCESS" "All tests passed! 🎉"
        exit 0
    else
        print_status "ERROR" "$failed_tests test(s) failed"
        exit 1
    fi
}

# Check dependencies
check_dependencies() {
    local missing_deps=0
    
    if ! command -v curl &> /dev/null; then
        print_status "ERROR" "curl is required but not installed"
        ((missing_deps++))
    fi
    
    if ! command -v jq &> /dev/null; then
        print_status "WARNING" "jq not found, some tests will be skipped"
    fi
    
    if ! command -v bc &> /dev/null; then
        print_status "WARNING" "bc not found, some calculations will be skipped"
    fi
    
    if [ $missing_deps -gt 0 ]; then
        print_status "ERROR" "Missing required dependencies"
        exit 1
    fi
}

# Script entry point
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    check_dependencies
    main "$@"
fi