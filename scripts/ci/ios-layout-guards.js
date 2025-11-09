#!/usr/bin/env node

/**
 * iOS Layout Guards - CI Script
 * ================================
 * Prevents common iOS layout anti-patterns from being committed.
 *
 * This script checks for patterns that cause layout issues on iOS devices
 * (iPhone with notch/Dynamic Island and home indicator).
 *
 * Usage:
 *   node scripts/ci/ios-layout-guards.js
 *
 * Exit codes:
 *   0 - All checks passed
 *   1 - Layout anti-patterns detected
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  srcDir: path.join(__dirname, '../../src'),
  excludePatterns: [
    '/node_modules/',
    '/.git/',
    '/www/',
    '/dist/',
    '/coverage/',
    '/.angular/',
    '/scripts/ci/ios-layout-guards.js', // Exclude this file
  ],
  filePatterns: {
    styles: ['.scss', '.css', '.sass'],
    templates: ['.html'],
    typescript: ['.ts'],
  }
};

// Anti-pattern rules
const RULES = {
  // Rule 1: Detect 100vh usage (should use --app-height instead)
  viewportHeight: {
    name: '100vh Usage',
    pattern: /(height|min-height|max-height):\s*(100vh|calc\([^)]*100vh)/g,
    severity: 'error',
    message: '100vh detected - use var(--app-height, 100vh) for iOS compatibility',
    fileTypes: ['.scss', '.css'],
    allowedExceptions: [
      // Allow if there's a comment explaining it's intentional
      /\/\/.*iOS-safe/i,
      /\/\*.*iOS-safe.*\*\//i,
    ],
  },

  // Rule 2: Detect position: fixed without safe-area consideration
  positionFixed: {
    name: 'Fixed Position Without Safe-Area',
    pattern: /position:\s*fixed/g,
    severity: 'warning',
    message: 'position:fixed detected - ensure safe-area insets are applied',
    fileTypes: ['.scss', '.css'],
    allowedExceptions: [
      // Allow if safe-area is mentioned nearby (within 10 lines)
      /safe-area-inset/i,
      /\.ios\s*&/i,
      /\/\/.*safe-area/i,
    ],
  },

  // Rule 3: Detect transform on potential overlay ancestors
  transformWarning: {
    name: 'Transform on Potential Overlay Ancestor',
    pattern: /transform:\s*(translate|scale|rotate)/g,
    severity: 'info',
    message: 'transform detected - ensure child overlays use ModalController/PopoverController',
    fileTypes: ['.scss', '.css'],
    allowedExceptions: [
      // Allow for animations with specific comments
      /\/\/.*animation/i,
      /\/\*.*animation.*\*\//i,
      /@keyframes/i,
    ],
  },

  // Rule 4: Detect nested overflow: scroll (iOS scroll issues)
  nestedScroll: {
    name: 'Nested Overflow Scroll',
    pattern: /overflow:\s*(auto|scroll)/g,
    severity: 'warning',
    message: 'overflow:scroll detected - avoid nested scroll containers on iOS',
    fileTypes: ['.scss', '.css'],
    allowedExceptions: [
      // Allow if it's for ion-content or modal content
      /ion-content/i,
      /modal-content/i,
      /\.ios\s*&/i,
    ],
  },

  // Rule 5: Detect missing ion-content in page templates
  missingIonContent: {
    name: 'Missing ion-content',
    pattern: /<ion-page[^>]*>[\s\S]*?<\/ion-page>/g,
    severity: 'warning',
    message: 'ion-page without ion-content detected - pages should use ion-content for proper scrolling',
    fileTypes: ['.html'],
    allowedExceptions: [],
    customCheck: (content, filePath) => {
      // Only check page files (not components)
      if (!filePath.includes('/pages/') || !filePath.endsWith('.page.html')) {
        return [];
      }

      const hasIonPage = /<ion-page/i.test(content);
      const hasIonContent = /<ion-content/i.test(content);

      if (hasIonPage && !hasIonContent) {
        return [{
          line: 1,
          column: 1,
          message: 'Page template uses ion-page but missing ion-content',
        }];
      }
      return [];
    },
  },
};

// Results tracking
let totalIssues = 0;
let errorCount = 0;
let warningCount = 0;
let infoCount = 0;

// ANSI colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  green: '\x1b[32m',
  gray: '\x1b[90m',
  bold: '\x1b[1m',
};

/**
 * Get all files to check based on git status
 * Only checks modified/added files in CI
 */
function getFilesToCheck() {
  const useGit = process.env.CI === 'true' || process.argv.includes('--git');

  if (useGit) {
    try {
      // Get staged files
      const stagedFiles = execSync('git diff --cached --name-only --diff-filter=ACM', { encoding: 'utf-8' })
        .split('\n')
        .filter(Boolean);

      // Get unstaged files
      const unstagedFiles = execSync('git diff --name-only --diff-filter=ACM', { encoding: 'utf-8' })
        .split('\n')
        .filter(Boolean);

      const files = [...new Set([...stagedFiles, ...unstagedFiles])];

      // Filter to only relevant files
      return files.filter(file => {
        const ext = path.extname(file);
        return (
          CONFIG.filePatterns.styles.includes(ext) ||
          CONFIG.filePatterns.templates.includes(ext) ||
          CONFIG.filePatterns.typescript.includes(ext)
        );
      }).map(file => path.join(process.cwd(), file));
    } catch (error) {
      console.warn(`${colors.yellow}Warning: Could not get git files, checking all files${colors.reset}`);
      return getAllFiles();
    }
  }

  return getAllFiles();
}

/**
 * Recursively get all relevant files from src directory
 */
function getAllFiles(dir = CONFIG.srcDir) {
  const files = [];

  function walk(directory) {
    const items = fs.readdirSync(directory);

    items.forEach(item => {
      const fullPath = path.join(directory, item);
      const stat = fs.statSync(fullPath);

      // Skip excluded patterns
      if (CONFIG.excludePatterns.some(pattern => fullPath.includes(pattern))) {
        return;
      }

      if (stat.isDirectory()) {
        walk(fullPath);
      } else {
        const ext = path.extname(fullPath);
        if (
          CONFIG.filePatterns.styles.includes(ext) ||
          CONFIG.filePatterns.templates.includes(ext) ||
          CONFIG.filePatterns.typescript.includes(ext)
        ) {
          files.push(fullPath);
        }
      }
    });
  }

  walk(dir);
  return files;
}

/**
 * Check a single file for anti-patterns
 */
function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const ext = path.extname(filePath);
  const relativePath = path.relative(process.cwd(), filePath);
  const issues = [];

  Object.entries(RULES).forEach(([ruleKey, rule]) => {
    // Skip if file type doesn't match
    if (!rule.fileTypes.includes(ext)) {
      return;
    }

    // Custom check function (like for missing ion-content)
    if (rule.customCheck) {
      const customIssues = rule.customCheck(content, filePath);
      customIssues.forEach(issue => {
        issues.push({
          rule: rule.name,
          severity: rule.severity,
          ...issue,
          file: relativePath,
        });
      });
      return;
    }

    // Pattern-based check
    const lines = content.split('\n');
    let match;

    while ((match = rule.pattern.exec(content)) !== null) {
      const matchPos = match.index;
      const lineNumber = content.substring(0, matchPos).split('\n').length;
      const lineContent = lines[lineNumber - 1];

      // Check if this match is allowed by exceptions
      const isException = rule.allowedExceptions.some(exception => {
        // Check current line
        if (exception.test(lineContent)) return true;

        // Check surrounding context (5 lines before/after)
        const contextStart = Math.max(0, lineNumber - 6);
        const contextEnd = Math.min(lines.length, lineNumber + 5);
        const context = lines.slice(contextStart, contextEnd).join('\n');

        return exception.test(context);
      });

      if (!isException) {
        issues.push({
          rule: rule.name,
          severity: rule.severity,
          line: lineNumber,
          column: match.index - content.lastIndexOf('\n', matchPos),
          matched: match[0],
          message: rule.message,
          file: relativePath,
        });
      }
    }

    // Reset regex state
    rule.pattern.lastIndex = 0;
  });

  return issues;
}

/**
 * Print issues in a readable format
 */
function printIssues(issues) {
  const groupedByFile = issues.reduce((acc, issue) => {
    if (!acc[issue.file]) {
      acc[issue.file] = [];
    }
    acc[issue.file].push(issue);
    return {};
  }, {});

  Object.entries(groupedByFile).forEach(([file, fileIssues]) => {
    console.log(`\n${colors.bold}${file}${colors.reset}`);

    fileIssues.forEach(issue => {
      const severityColor = {
        error: colors.red,
        warning: colors.yellow,
        info: colors.blue,
      }[issue.severity];

      const severityLabel = issue.severity.toUpperCase().padEnd(7);

      console.log(
        `  ${severityColor}${severityLabel}${colors.reset} ` +
        `${colors.gray}Line ${issue.line}:${issue.column}${colors.reset} ` +
        `${issue.message}`
      );

      if (issue.matched) {
        console.log(`    ${colors.gray}Found: ${issue.matched}${colors.reset}`);
      }
    });
  });
}

/**
 * Main execution
 */
function main() {
  console.log(`${colors.bold}${colors.blue}
┌─────────────────────────────────────────┐
│   iOS Layout Guards - CI Check          │
│   Ensuring iOS-safe layouts             │
└─────────────────────────────────────────┘
${colors.reset}\n`);

  const files = getFilesToCheck();
  console.log(`Checking ${files.length} file(s)...\n`);

  const allIssues = [];

  files.forEach(file => {
    const issues = checkFile(file);
    allIssues.push(...issues);

    issues.forEach(issue => {
      totalIssues++;
      if (issue.severity === 'error') errorCount++;
      else if (issue.severity === 'warning') warningCount++;
      else if (issue.severity === 'info') infoCount++;
    });
  });

  if (allIssues.length > 0) {
    printIssues(allIssues);

    console.log(`\n${colors.bold}Summary:${colors.reset}`);
    if (errorCount > 0) {
      console.log(`  ${colors.red}✗ ${errorCount} error(s)${colors.reset}`);
    }
    if (warningCount > 0) {
      console.log(`  ${colors.yellow}⚠ ${warningCount} warning(s)${colors.reset}`);
    }
    if (infoCount > 0) {
      console.log(`  ${colors.blue}ℹ ${infoCount} info${colors.reset}`);
    }

    console.log(`\n${colors.yellow}Fix these issues before committing to ensure iOS compatibility.${colors.reset}`);
    console.log(`\n${colors.gray}For more information, see: docs/ios-hardening-report.md${colors.reset}\n`);

    // Exit with error code if errors found
    if (errorCount > 0) {
      process.exit(1);
    }
  } else {
    console.log(`${colors.green}✓ No iOS layout anti-patterns detected!${colors.reset}\n`);
  }
}

// Run the script
main();
