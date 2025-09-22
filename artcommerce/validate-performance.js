#!/usr/bin/env node

/**
 * Performance Optimization Validation Script
 * This script validates that all performance optimizations are properly implemented
 */

const fs = require('fs');
const path = require('path');

const COLORS = {
  GREEN: '\x1b[32m',
  RED: '\x1b[31m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  RESET: '\x1b[0m',
  BOLD: '\x1b[1m'
};

function log(message, color = COLORS.RESET) {
  console.log(`${color}${message}${COLORS.RESET}`);
}

function checkFileExists(filePath) {
  const fullPath = path.join(__dirname, filePath);
  return fs.existsSync(fullPath);
}

function checkFileContains(filePath, searchString) {
  try {
    const fullPath = path.join(__dirname, filePath);
    const content = fs.readFileSync(fullPath, 'utf8');
    return content.includes(searchString);
  } catch (error) {
    return false;
  }
}

function validateImplementation() {
  log(`${COLORS.BOLD}🚀 Performance Optimization Validation${COLORS.RESET}\n`);
  
  let totalChecks = 0;
  let passedChecks = 0;

  // Helper function for checks
  const check = (name, condition, details = '') => {
    totalChecks++;
    if (condition) {
      log(`✅ ${name}`, COLORS.GREEN);
      passedChecks++;
    } else {
      log(`❌ ${name}`, COLORS.RED);
      if (details) log(`   ${details}`, COLORS.YELLOW);
    }
  };

  log(`${COLORS.BLUE}📂 Core Performance Files:${COLORS.RESET}`);
  
  // Memory leak prevention
  check(
    'Memory leak prevention hook exists',
    checkFileExists('app/hooks/useImagePreload.ts'),
    'Expected app/hooks/useImagePreload.ts'
  );

  check(
    'Optimized scroll hook exists',
    checkFileExists('app/hooks/useOptimizedScroll.ts'),
    'Expected app/hooks/useOptimizedScroll.ts'
  );

  // CSS animations
  check(
    'Hardware-accelerated CSS animations exist',
    checkFileExists('app/products/products-animations.module.css'),
    'Expected app/products/products-animations.module.css'
  );

  // Virtual scrolling
  check(
    'Virtual scrolling hook exists',
    checkFileExists('app/hooks/useVirtualScroll.ts'),
    'Expected app/hooks/useVirtualScroll.ts'
  );

  check(
    'Virtual product grid component exists',
    checkFileExists('app/components/VirtualProductGrid.tsx'),
    'Expected app/components/VirtualProductGrid.tsx'
  );

  // Search optimization
  check(
    'Optimized search hook exists',
    checkFileExists('app/hooks/useOptimizedSearch.ts'),
    'Expected app/hooks/useOptimizedSearch.ts'
  );

  check(
    'Optimized search component exists',
    checkFileExists('app/components/OptimizedSearch.tsx'),
    'Expected app/components/OptimizedSearch.tsx'
  );

  check(
    'Optimized search modal exists',
    checkFileExists('app/components/OptimizedSearchModal.tsx'),
    'Expected app/components/OptimizedSearchModal.tsx'
  );

  // Bundle optimization
  check(
    'Bundle optimizer exists',
    checkFileExists('app/components/BundleOptimizer.tsx'),
    'Expected app/components/BundleOptimizer.tsx'
  );

  check(
    'Lazy components exist',
    checkFileExists('app/components/LazyComponents.tsx'),
    'Expected app/components/LazyComponents.tsx'
  );

  // Performance monitoring
  check(
    'Performance optimizer exists',
    checkFileExists('app/components/PerformanceOptimizer.tsx'),
    'Expected app/components/PerformanceOptimizer.tsx'
  );

  log(`\n${COLORS.BLUE}🔧 Implementation Integration:${COLORS.RESET}`);

  // ProductCard component
  check(
    'ProductCard component exists',
    checkFileExists('app/components/ProductCard.tsx'),
    'Expected app/components/ProductCard.tsx'
  );

  // Check ProductsClient integration
  check(
    'ProductsClient uses ProductCard component',
    checkFileContains('app/products/ProductsClient.tsx', 'import ProductCard') &&
    checkFileContains('app/products/ProductsClient.tsx', '<ProductCard'),
    'ProductsClient should import and use ProductCard'
  );

  check(
    'ProductsClient has virtual scrolling integration',
    checkFileContains('app/products/ProductsClient.tsx', 'VirtualProductGrid') &&
    checkFileContains('app/products/ProductsClient.tsx', 'products.length > 50'),
    'ProductsClient should conditionally use VirtualProductGrid for large lists'
  );

  // Check Navbar integration
  check(
    'Navbar uses optimized search',
    checkFileContains('app/components/Navbar.tsx', 'OptimizedSearchModal'),
    'Navbar should use OptimizedSearchModal instead of SearchModal'
  );

  // Check layout integration
  check(
    'Layout includes performance optimizer',
    checkFileContains('app/layout.tsx', 'PerformanceOptimizer'),
    'Layout should include PerformanceOptimizer component'
  );

  log(`\n${COLORS.BLUE}📋 CSS Animation Integration:${COLORS.RESET}`);

  check(
    'ProductsClient imports animation styles',
    checkFileContains('app/products/ProductsClient.tsx', 'animationStyles'),
    'ProductsClient should import animation styles'
  );

  check(
    'ProductCard uses animation classes',
    checkFileContains('app/components/ProductCard.tsx', 'animationStyles'),
    'ProductCard should use animation styles'
  );

  log(`\n${COLORS.BLUE}📖 Documentation:${COLORS.RESET}`);

  check(
    'Performance optimization guide exists',
    checkFileExists('PERFORMANCE_OPTIMIZATION_GUIDE.md'),
    'Expected PERFORMANCE_OPTIMIZATION_GUIDE.md'
  );

  // Final summary
  log(`\n${COLORS.BOLD}📊 Validation Summary:${COLORS.RESET}`);
  log(`Total checks: ${totalChecks}`);
  log(`Passed: ${passedChecks}`, passedChecks === totalChecks ? COLORS.GREEN : COLORS.YELLOW);
  log(`Failed: ${totalChecks - passedChecks}`, totalChecks - passedChecks === 0 ? COLORS.GREEN : COLORS.RED);
  
  const percentage = Math.round((passedChecks / totalChecks) * 100);
  log(`Success rate: ${percentage}%`, percentage >= 90 ? COLORS.GREEN : percentage >= 75 ? COLORS.YELLOW : COLORS.RED);

  if (percentage >= 90) {
    log(`\n🎉 ${COLORS.GREEN}${COLORS.BOLD}Excellent! Performance optimizations are well implemented.${COLORS.RESET}`);
  } else if (percentage >= 75) {
    log(`\n⚠️  ${COLORS.YELLOW}${COLORS.BOLD}Good progress! Some optimizations need attention.${COLORS.RESET}`);
  } else {
    log(`\n❌ ${COLORS.RED}${COLORS.BOLD}Several optimizations are missing or incomplete.${COLORS.RESET}`);
  }

  log(`\n${COLORS.BLUE}🚀 Next Steps:${COLORS.RESET}`);
  log(`1. Run: npm run build (check bundle sizes)`);
  log(`2. Run: npm run dev (test in development)`);
  log(`3. Check browser DevTools Performance tab`);
  log(`4. Monitor Core Web Vitals in production`);
  
  return percentage >= 90;
}

// Run validation
validateImplementation();
