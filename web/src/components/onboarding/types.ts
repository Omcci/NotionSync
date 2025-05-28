import { ComponentType } from 'react'
import { SyncRepo } from '../../../types'

export interface OnboardingStep {
  title: string
  description: string
  component: ComponentType<any>
}

export interface OnboardingFlowProps {
  onComplete: () => void
}

export interface OnboardingHeaderProps {
  title: string
  description: string
  currentStep: number
  totalSteps: number
  onSkip: () => void
}

export interface OnboardingProgressBarProps {
  currentStep: number
  totalSteps: number
}

export interface StepComponentProps {
  onNext?: () => void
  onPrevious?: () => void
  onSkip?: () => void
}

export interface RepositorySelectionStepProps {
  availableRepos: SyncRepo[]
  selectedRepos: Set<string>
  isLoading: boolean
  onRepoToggle: (repoId: string) => void
}
