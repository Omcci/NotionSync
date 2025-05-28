import React from 'react'
import { OnboardingProgressBarProps } from './types'

const OnboardingProgressBar: React.FC<OnboardingProgressBarProps> = ({
    currentStep,
    totalSteps
}) => {
    const progressPercentage = ((currentStep + 1) / totalSteps) * 100

    return (
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
                className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
            />
        </div>
    )
}

export default OnboardingProgressBar 