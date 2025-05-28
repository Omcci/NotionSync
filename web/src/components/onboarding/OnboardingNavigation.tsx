import React from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight } from 'lucide-react'

interface OnboardingNavigationProps {
  currentStep: number
  totalSteps: number
  canProceed: boolean
  onPrevious: () => void
  onNext: () => void
  onSkip: () => void
  isFirstStep: boolean
}

const OnboardingNavigation: React.FC<OnboardingNavigationProps> = ({
  currentStep,
  totalSteps,
  canProceed,
  onPrevious,
  onNext,
  onSkip,
  isFirstStep,
}) => {
  const isLastStep = currentStep === totalSteps - 1

  return (
    <div className="flex justify-between p-6 border-t">
      <div className="flex space-x-2">
        <Button variant="outline" onClick={onPrevious} disabled={isFirstStep}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>

        {isFirstStep && (
          <Button variant="ghost" onClick={onSkip} className="text-gray-600">
            Skip & Explore
          </Button>
        )}
      </div>

      <Button onClick={onNext} disabled={!canProceed}>
        {isLastStep ? 'Get Started' : 'Next'}
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  )
}

export default OnboardingNavigation
