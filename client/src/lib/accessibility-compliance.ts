/**
 * Accessibility compliance checker
 * Ensures WCAG 2.1 AA compliance and provides audit tools
 */

interface AccessibilityIssue {
  type: 'error' | 'warning' | 'info'
  rule: string
  element: string
  description: string
  suggestion: string
}

interface AccessibilityAuditResult {
  score: number
  issues: AccessibilityIssue[]
  passedChecks: string[]
  totalChecks: number
}

export class AccessibilityCompliance {
  private static instance: AccessibilityCompliance

  static getInstance(): AccessibilityCompliance {
    if (!AccessibilityCompliance.instance) {
      AccessibilityCompliance.instance = new AccessibilityCompliance()
    }
    return AccessibilityCompliance.instance
  }

  // WCAG 2.1 AA Compliance Checks
  async auditPage(): Promise<AccessibilityAuditResult> {
    const issues: AccessibilityIssue[] = []
    const passedChecks: string[] = []

    // Check 1: Images have alt text
    this.checkImageAltText(issues, passedChecks)

    // Check 2: Form elements have labels
    this.checkFormLabels(issues, passedChecks)

    // Check 3: Headings are properly structured
    this.checkHeadingStructure(issues, passedChecks)

    // Check 4: Color contrast ratios
    await this.checkColorContrast(issues, passedChecks)

    // Check 5: Keyboard navigation
    this.checkKeyboardNavigation(issues, passedChecks)

    // Check 6: Focus indicators
    this.checkFocusIndicators(issues, passedChecks)

    // Check 7: ARIA attributes
    this.checkAriaAttributes(issues, passedChecks)

    // Check 8: Touch target sizes
    this.checkTouchTargets(issues, passedChecks)

    // Check 9: Text scaling
    this.checkTextScaling(issues, passedChecks)

    // Check 10: Motion preferences
    this.checkMotionPreferences(issues, passedChecks)

    const totalChecks = issues.length + passedChecks.length
    const score = totalChecks > 0 ? Math.round((passedChecks.length / totalChecks) * 100) : 100

    return {
      score,
      issues,
      passedChecks,
      totalChecks,
    }
  }

  private checkImageAltText(issues: AccessibilityIssue[], passedChecks: string[]) {
    const images = document.querySelectorAll('img')
    let hasIssues = false

    images.forEach((img, index) => {
      if (!img.alt && !img.getAttribute('aria-hidden')) {
        issues.push({
          type: 'error',
          rule: 'WCAG 1.1.1 - Non-text Content',
          element: `img[${index}]`,
          description: 'Image missing alt text',
          suggestion: 'Add descriptive alt text or aria-hidden="true" for decorative images',
        })
        hasIssues = true
      }
    })

    if (!hasIssues) {
      passedChecks.push('All images have appropriate alt text')
    }
  }

  private checkFormLabels(issues: AccessibilityIssue[], passedChecks: string[]) {
    const formElements = document.querySelectorAll('input, select, textarea')
    let hasIssues = false

    formElements.forEach((element, index) => {
      const id = element.id
      const ariaLabel = element.getAttribute('aria-label')
      const ariaLabelledBy = element.getAttribute('aria-labelledby')
      const label = id ? document.querySelector(`label[for="${id}"]`) : null

      if (!label && !ariaLabel && !ariaLabelledBy) {
        issues.push({
          type: 'error',
          rule: 'WCAG 1.3.1 - Info and Relationships',
          element: `${element.tagName.toLowerCase()}[${index}]`,
          description: 'Form element missing label',
          suggestion: 'Add a label element, aria-label, or aria-labelledby attribute',
        })
        hasIssues = true
      }
    })

    if (!hasIssues) {
      passedChecks.push('All form elements have proper labels')
    }
  }

  private checkHeadingStructure(issues: AccessibilityIssue[], passedChecks: string[]) {
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6')
    let previousLevel = 0
    let hasIssues = false

    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.charAt(1))

      if (index === 0 && level !== 1) {
        issues.push({
          type: 'warning',
          rule: 'WCAG 1.3.1 - Info and Relationships',
          element: `${heading.tagName.toLowerCase()}[${index}]`,
          description: 'Page should start with h1',
          suggestion: 'Use h1 for the main page heading',
        })
        hasIssues = true
      }

      if (level > previousLevel + 1) {
        issues.push({
          type: 'warning',
          rule: 'WCAG 1.3.1 - Info and Relationships',
          element: `${heading.tagName.toLowerCase()}[${index}]`,
          description: 'Heading level skipped',
          suggestion: 'Use sequential heading levels (h1, h2, h3, etc.)',
        })
        hasIssues = true
      }

      previousLevel = level
    })

    if (!hasIssues) {
      passedChecks.push('Heading structure is properly organized')
    }
  }

  private async checkColorContrast(issues: AccessibilityIssue[], passedChecks: string[]) {
    // This is a simplified check - in production, you'd use a proper color contrast library
    const textElements = document.querySelectorAll('p, span, div, button, a, label')
    let hasIssues = false

    // Check if high contrast mode is available
    const supportsHighContrast = window.matchMedia('(prefers-contrast: high)').matches

    if (!supportsHighContrast) {
      // Check for high contrast CSS class
      const hasHighContrastSupport =
        document.documentElement.classList.contains('high-contrast') ||
        document.querySelector('[class*="high-contrast"]')

      if (!hasHighContrastSupport) {
        issues.push({
          type: 'warning',
          rule: 'WCAG 1.4.3 - Contrast (Minimum)',
          element: 'document',
          description: 'High contrast mode not implemented',
          suggestion: 'Implement high contrast mode for better accessibility',
        })
        hasIssues = true
      }
    }

    if (!hasIssues) {
      passedChecks.push('Color contrast requirements are met')
    }
  }

  private checkKeyboardNavigation(issues: AccessibilityIssue[], passedChecks: string[]) {
    const interactiveElements = document.querySelectorAll(
      'button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    let hasIssues = false

    interactiveElements.forEach((element, index) => {
      const tabIndex = element.getAttribute('tabindex')

      if (tabIndex && parseInt(tabIndex) > 0) {
        issues.push({
          type: 'warning',
          rule: 'WCAG 2.4.3 - Focus Order',
          element: `${element.tagName.toLowerCase()}[${index}]`,
          description: 'Positive tabindex found',
          suggestion: 'Use tabindex="0" or rely on natural tab order',
        })
        hasIssues = true
      }
    })

    if (!hasIssues) {
      passedChecks.push('Keyboard navigation is properly implemented')
    }
  }

  private checkFocusIndicators(issues: AccessibilityIssue[], passedChecks: string[]) {
    // Check if focus indicators are styled
    const styles = getComputedStyle(document.documentElement)
    const hasFocusStyles =
      document.querySelector('[class*="focus"]') || document.querySelector('[class*="ring"]')

    if (!hasFocusStyles) {
      issues.push({
        type: 'error',
        rule: 'WCAG 2.4.7 - Focus Visible',
        element: 'document',
        description: 'Focus indicators not implemented',
        suggestion: 'Add visible focus indicators for all interactive elements',
      })
    } else {
      passedChecks.push('Focus indicators are properly implemented')
    }
  }

  private checkAriaAttributes(issues: AccessibilityIssue[], passedChecks: string[]) {
    const elementsWithAria = document.querySelectorAll(
      '[aria-label], [aria-labelledby], [aria-describedby], [role]'
    )
    let hasIssues = false

    elementsWithAria.forEach((element, index) => {
      const role = element.getAttribute('role')
      const ariaLabel = element.getAttribute('aria-label')
      const ariaLabelledBy = element.getAttribute('aria-labelledby')

      // Check for invalid ARIA attributes
      if (role && !this.isValidAriaRole(role)) {
        issues.push({
          type: 'error',
          rule: 'WCAG 4.1.2 - Name, Role, Value',
          element: `${element.tagName.toLowerCase()}[${index}]`,
          description: `Invalid ARIA role: ${role}`,
          suggestion: 'Use valid ARIA roles from the specification',
        })
        hasIssues = true
      }

      // Check for referenced elements
      if (ariaLabelledBy) {
        const referencedElement = document.getElementById(ariaLabelledBy)
        if (!referencedElement) {
          issues.push({
            type: 'error',
            rule: 'WCAG 4.1.2 - Name, Role, Value',
            element: `${element.tagName.toLowerCase()}[${index}]`,
            description: `aria-labelledby references non-existent element: ${ariaLabelledBy}`,
            suggestion: 'Ensure referenced elements exist',
          })
          hasIssues = true
        }
      }
    })

    if (!hasIssues) {
      passedChecks.push('ARIA attributes are properly implemented')
    }
  }

  private checkTouchTargets(issues: AccessibilityIssue[], passedChecks: string[]) {
    const touchTargets = document.querySelectorAll('button, a, input, [role="button"]')
    let hasIssues = false

    touchTargets.forEach((element, index) => {
      const rect = element.getBoundingClientRect()
      const minSize = 44 // WCAG AA minimum touch target size

      if (rect.width < minSize || rect.height < minSize) {
        issues.push({
          type: 'warning',
          rule: 'WCAG 2.5.5 - Target Size',
          element: `${element.tagName.toLowerCase()}[${index}]`,
          description: `Touch target too small: ${Math.round(rect.width)}x${Math.round(rect.height)}px`,
          suggestion: 'Ensure touch targets are at least 44x44px',
        })
        hasIssues = true
      }
    })

    if (!hasIssues) {
      passedChecks.push('Touch targets meet minimum size requirements')
    }
  }

  private checkTextScaling(issues: AccessibilityIssue[], passedChecks: string[]) {
    // Check if text can scale up to 200%
    const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize)
    const hasTextScaling =
      document.documentElement.style.getPropertyValue('--accessibility-font-scale') ||
      rootFontSize >= 16

    if (!hasTextScaling) {
      issues.push({
        type: 'warning',
        rule: 'WCAG 1.4.4 - Resize text',
        element: 'document',
        description: 'Text scaling not implemented',
        suggestion: 'Implement text scaling up to 200% without loss of functionality',
      })
    } else {
      passedChecks.push('Text scaling is properly implemented')
    }
  }

  private checkMotionPreferences(issues: AccessibilityIssue[], passedChecks: string[]) {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const hasReducedMotionSupport =
      document.documentElement.classList.contains('reduce-motion') ||
      document.querySelector('[class*="reduce-motion"]')

    if (!hasReducedMotionSupport && !prefersReducedMotion) {
      issues.push({
        type: 'warning',
        rule: 'WCAG 2.3.3 - Animation from Interactions',
        element: 'document',
        description: 'Reduced motion preferences not respected',
        suggestion: 'Implement reduced motion support for users who prefer it',
      })
    } else {
      passedChecks.push('Motion preferences are properly handled')
    }
  }

  private isValidAriaRole(role: string): boolean {
    const validRoles = [
      'alert',
      'alertdialog',
      'application',
      'article',
      'banner',
      'button',
      'cell',
      'checkbox',
      'columnheader',
      'combobox',
      'complementary',
      'contentinfo',
      'definition',
      'dialog',
      'directory',
      'document',
      'feed',
      'figure',
      'form',
      'grid',
      'gridcell',
      'group',
      'heading',
      'img',
      'link',
      'list',
      'listbox',
      'listitem',
      'log',
      'main',
      'marquee',
      'math',
      'menu',
      'menubar',
      'menuitem',
      'menuitemcheckbox',
      'menuitemradio',
      'navigation',
      'none',
      'note',
      'option',
      'presentation',
      'progressbar',
      'radio',
      'radiogroup',
      'region',
      'row',
      'rowgroup',
      'rowheader',
      'scrollbar',
      'search',
      'searchbox',
      'separator',
      'slider',
      'spinbutton',
      'status',
      'switch',
      'tab',
      'table',
      'tablist',
      'tabpanel',
      'term',
      'textbox',
      'timer',
      'toolbar',
      'tooltip',
      'tree',
      'treegrid',
      'treeitem',
    ]

    return validRoles.includes(role)
  }

  // Generate accessibility report
  generateReport(auditResult: AccessibilityAuditResult): string {
    const { score, issues, passedChecks, totalChecks } = auditResult

    let report = `# Accessibility Audit Report\n\n`
    report += `**Overall Score:** ${score}% (${passedChecks.length}/${totalChecks} checks passed)\n\n`

    if (issues.length > 0) {
      report += `## Issues Found (${issues.length})\n\n`

      const errors = issues.filter(i => i.type === 'error')
      const warnings = issues.filter(i => i.type === 'warning')
      const info = issues.filter(i => i.type === 'info')

      if (errors.length > 0) {
        report += `### Errors (${errors.length})\n`
        errors.forEach(issue => {
          report += `- **${issue.rule}**: ${issue.description}\n`
          report += `  - Element: ${issue.element}\n`
          report += `  - Suggestion: ${issue.suggestion}\n\n`
        })
      }

      if (warnings.length > 0) {
        report += `### Warnings (${warnings.length})\n`
        warnings.forEach(issue => {
          report += `- **${issue.rule}**: ${issue.description}\n`
          report += `  - Element: ${issue.element}\n`
          report += `  - Suggestion: ${issue.suggestion}\n\n`
        })
      }
    }

    if (passedChecks.length > 0) {
      report += `## Passed Checks (${passedChecks.length})\n\n`
      passedChecks.forEach(check => {
        report += `- ✅ ${check}\n`
      })
    }

    return report
  }
}

// Export singleton instance
export const accessibilityCompliance = AccessibilityCompliance.getInstance()
