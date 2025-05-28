import React from 'react'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import OnboardingProgressBar from './OnboardingProgressBar'
import { OnboardingHeaderProps } from './types'

const OnboardingHeader: React.FC<OnboardingHeaderProps> = ({
  title,
  description,
  currentStep,
  totalSteps,
  onSkip,
}) => {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{title}</h1>
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            Step {currentStep + 1} of {totalSteps}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onSkip}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-4 h-4 mr-1" />
            Skip Setup
          </Button>
        </div>
      </div>
      <div className="mt-4">
        <OnboardingProgressBar
          currentStep={currentStep}
          totalSteps={totalSteps}
        />
      </div>
    </div>
  )
}

export default OnboardingHeader
