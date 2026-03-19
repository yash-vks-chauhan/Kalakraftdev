import { ReactNode } from 'react'
import styles from '../auth.module.css'

type ForgotPasswordShellProps = {
  children: ReactNode
  title: string
  subtitle: string
  currentStep: 1 | 2 | 3
  footer?: ReactNode
}

const STEPS = [
  {
    label: 'Request code',
    description: 'Start with the email attached to your account.',
  },
  {
    label: 'Verify reset',
    description: 'Enter the code and choose a new password.',
  },
  {
    label: 'Return to sign in',
    description: 'Use the updated password to get back in.',
  },
] as const

export default function ForgotPasswordShell({
  children,
  title,
  subtitle,
  currentStep,
  footer,
}: ForgotPasswordShellProps) {
  return (
    <div className={styles.authContainer}>
      <div className={`${styles.authCard} ${styles.flowCard}`}>
        <div className={styles.authHeader}>
          <h1 className={styles.authTitle}>{title}</h1>
          <p className={styles.authSubtitle}>{subtitle}</p>
        </div>

        <div className={styles.flowRail} aria-label="Forgot password progress">
          {STEPS.map((step, index) => {
            const stepNumber = (index + 1) as 1 | 2 | 3
            const state =
              stepNumber < currentStep
                ? 'complete'
                : stepNumber === currentStep
                  ? 'active'
                  : 'upcoming'

            return (
              <div key={step.label} className={styles.flowStep} data-state={state}>
                <div className={styles.flowStepNumber}>{`0${stepNumber}`}</div>
                <div className={styles.flowStepContent}>
                  <div className={styles.flowStepLabel}>{step.label}</div>
                  <div className={styles.flowStepDescription}>{step.description}</div>
                </div>
              </div>
            )
          })}
        </div>

        {children}

        {footer ? <div className={styles.authFooter}>{footer}</div> : null}
      </div>
    </div>
  )
}
