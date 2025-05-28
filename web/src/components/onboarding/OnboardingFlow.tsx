import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useAppContext } from '@/context/AppContext'
import { useUser } from '@/context/UserContext'
import { SyncRepo } from '../../../types/repository'
import { useQuery } from '@tanstack/react-query'
import { OnboardingFlowProps, OnboardingStep } from './types'
import OnboardingHeader from './OnboardingHeader'
import OnboardingNavigation from './OnboardingNavigation'
import WelcomeStep from './steps/WelcomeStep'
import RepositorySelectionStep from './steps/RepositorySelectionStep'
import ConfigurationStep from './steps/ConfigurationStep'
import CompletionStep from './steps/CompletionStep'

const fetchAllRepositories = async (
  githubToken: string,
): Promise<SyncRepo[]> => {
  const response = await fetch('/api/repos/all', {
    headers: {
      Authorization: `Bearer ${githubToken}`,
    },
  })
  if (!response.ok) {
    throw new Error('Failed to fetch repositories')
  }
  const data = await response.json()
  return data.repos || []
}

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedRepos, setSelectedRepos] = useState<Set<string>>(new Set())
  const { githubToken, markOnboardingComplete } = useUser()
  const { setRepos } = useAppContext()

  const {
    data: availableRepos = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['onboarding-repos', githubToken],
    queryFn: () => fetchAllRepositories(githubToken!),
    enabled: !!githubToken && currentStep === 1,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    retry: 2,
  })

  const steps: OnboardingStep[] = [
    {
      title: 'Welcome to NotionSync! 👋',
      description: "Let's get you set up in just a few steps",
      component: WelcomeStep,
    },
    {
      title: 'Select Repositories 📚',
      description: 'Choose which repositories to sync with Notion',
      component: RepositorySelectionStep,
    },
    {
      title: 'Configure Settings ⚙️',
      description: 'Set up your sync preferences',
      component: ConfigurationStep,
    },
    {
      title: "You're All Set! 🚀",
      description: 'Start syncing your GitHub activity with Notion',
      component: CompletionStep,
    },
  ]

  const handleRepoToggle = (repoId: string) => {
    const newSelected = new Set(selectedRepos)
    if (newSelected.has(repoId)) {
      newSelected.delete(repoId)
    } else {
      newSelected.add(repoId)
    }
    setSelectedRepos(newSelected)
  }

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      const selectedRepoObjects: SyncRepo[] = availableRepos
        .filter((repo) => selectedRepos.has(repo.id))
        .map((repo) => ({
          ...repo,
          syncEnabled: true, // Enable sync for selected repos
        }))
      setRepos(selectedRepoObjects)
      await markOnboardingComplete()
      onComplete()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkip = async () => {
    await markOnboardingComplete()
    onComplete()
  }

  const canProceed = () => {
    if (currentStep === 1) {
      return selectedRepos.size > 0
    }
    return true
  }

  const renderCurrentStep = () => {
    const CurrentStepComponent = steps[currentStep].component

    switch (currentStep) {
      case 1:
        return (
          <RepositorySelectionStep
            availableRepos={availableRepos}
            selectedRepos={selectedRepos}
            isLoading={isLoading}
            onRepoToggle={handleRepoToggle}
          />
        )
      default:
        return <CurrentStepComponent />
    }
  }

  if (error) {
    return <div>Error: {error.message}</div>
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <OnboardingHeader
            title={steps[currentStep].title}
            description={steps[currentStep].description}
            currentStep={currentStep}
            totalSteps={steps.length}
            onSkip={handleSkip}
          />
        </CardHeader>
        <CardContent>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderCurrentStep()}
            </motion.div>
          </AnimatePresence>
        </CardContent>
        <OnboardingNavigation
          currentStep={currentStep}
          totalSteps={steps.length}
          canProceed={canProceed()}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onSkip={handleSkip}
          isFirstStep={currentStep === 0}
        />
      </Card>
    </div>
  )
}

export default OnboardingFlow
