import { ReactNode } from 'react'
import { Commit } from './types'

// Component Props Types
export interface SelectOption {
  value: string
  label: string
}

export interface SelectComponentProps {
  placeholder: string
  options: SelectOption[]
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export interface GitHubAuthGuideProps {
  onComplete: () => void
}

export interface ModalCommitsProps {
  commits: any[]
  isOpen: boolean
  onClose: () => void
  selectedDate: string
}

export interface ErrorMessageProps {
  message: string
}

export interface CommitDetailsProps {
  commitDetails: Commit[]
}

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export interface EeDialProps {
  children: ReactNode
}

export interface GlowingButtonProps {
  children: ReactNode
  onClick?: () => void
  className?: string
}

// Filter Types
export interface Filter {
  author: string
  dateRange: { start: string; end: string }
  repository: string
}

export interface CommitLogFiltersProps {
  onFilterChange: (filters: Filter) => void
  repositories: string[]
}

// Feature Types
export interface FeatureItemProps {
  number: string
  title: string
  description: string
  imageSource: string
  link: string
  button: string
  gradient: string
  icon: ReactNode
}

export interface ReauthenticatePromptProps {
  reason?: string
  onReauthenticate?: () => void
}
