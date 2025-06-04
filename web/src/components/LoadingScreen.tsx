import React, { useState, useEffect } from 'react'
import { LoadingSpinner } from './ui/loadingspinner'
import { Github, Calendar, GitBranch, Sparkles, Clock, CheckCircle, Users, Target } from 'lucide-react'

interface LoadingScreenProps {
    title?: string
    subtitle?: string
    showCalendarTips?: boolean
}

interface LoadingStep {
    id: string
    icon: React.ReactNode
    title: string
    subtitle: string
    duration: number
}

const loadingSteps: LoadingStep[] = [
    {
        id: 'fetching',
        icon: <Github className="w-8 h-8 text-blue-500" />,
        title: 'Connecting to GitHub',
        subtitle: 'Establishing secure connection with GitHub API...',
        duration: 2000,
    },
    {
        id: 'repositories',
        icon: <GitBranch className="w-8 h-8 text-green-500" />,
        title: 'Scanning Repositories',
        subtitle: 'Discovering your repositories and branches...',
        duration: 2500,
    },
    {
        id: 'commits',
        icon: <Sparkles className="w-8 h-8 text-purple-500" />,
        title: 'Analyzing Commits',
        subtitle: 'Processing your commit history and development patterns...',
        duration: 3000,
    },
    {
        id: 'organizing',
        icon: <Calendar className="w-8 h-8 text-orange-500" />,
        title: 'Organizing Timeline',
        subtitle: 'Building your personalized development calendar...',
        duration: 2000,
    },
]

const calendarTips = [
    {
        icon: <Calendar className="w-6 h-6 text-blue-500" />,
        title: 'Navigate Your Development Timeline',
        description: 'Click on any date to see all commits made that day across your repositories.',
    },
    {
        icon: <Target className="w-6 h-6 text-green-500" />,
        title: 'Filter by Repository',
        description: 'Use the repository selector to focus on specific projects and see their commit patterns.',
    },
    {
        icon: <Clock className="w-6 h-6 text-purple-500" />,
        title: 'Track Your Productivity',
        description: 'Visualize your coding streaks and identify your most productive days and times.',
    },
    {
        icon: <Users className="w-6 h-6 text-orange-500" />,
        title: 'Export & Share',
        description: 'Generate reports of your development activity to share with your team or manager.',
    },
]

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
    title = 'Loading Your Development Timeline',
    subtitle = 'Please wait while we fetch your commit history...',
    showCalendarTips = true,
}) => {
    const [currentStepIndex, setCurrentStepIndex] = useState(0)
    const [currentTipIndex, setCurrentTipIndex] = useState(0)
    const [progress, setProgress] = useState(0)
    const [showTips, setShowTips] = useState(false)

    useEffect(() => {
        let stepTimer: NodeJS.Timeout
        let progressTimer: NodeJS.Timeout

        const startNextStep = () => {
            if (currentStepIndex < loadingSteps.length - 1) {
                stepTimer = setTimeout(() => {
                    setCurrentStepIndex(prev => prev + 1)
                    setProgress(((currentStepIndex + 2) / loadingSteps.length) * 100)
                }, loadingSteps[currentStepIndex].duration)
            } else {
                // All steps completed, show tips if enabled
                if (showCalendarTips) {
                    setTimeout(() => setShowTips(true), 500)
                }
            }
        }

        // Update progress gradually
        const updateProgress = () => {
            const stepProgress = ((currentStepIndex + 1) / loadingSteps.length) * 100
            const progressIncrement = stepProgress / (loadingSteps[currentStepIndex].duration / 50)

            progressTimer = setInterval(() => {
                setProgress(prev => {
                    const newProgress = prev + progressIncrement
                    if (newProgress >= stepProgress) {
                        clearInterval(progressTimer)
                        return stepProgress
                    }
                    return newProgress
                })
            }, 50)
        }

        startNextStep()
        updateProgress()

        return () => {
            clearTimeout(stepTimer)
            clearInterval(progressTimer)
        }
    }, [currentStepIndex, showCalendarTips])

    // Cycle through tips
    useEffect(() => {
        if (showTips) {
            const tipTimer = setInterval(() => {
                setCurrentTipIndex(prev => (prev + 1) % calendarTips.length)
            }, 3500)

            return () => clearInterval(tipTimer)
        }
    }, [showTips])

    const currentStep = loadingSteps[currentStepIndex]
    const currentTip = calendarTips[currentTipIndex]

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-blue-900">
            {/* Grid container for perfect centering */}
            <div className="min-h-screen grid place-items-center p-8">
                <div className="w-full max-w-lg mx-auto">
                    {/* Main loading card */}
                    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-8 text-center">
                        {/* Header */}
                        <div className="mb-8">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                                {title}
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                                {subtitle}
                            </p>
                        </div>

                        {/* Loading animation and current step */}
                        <div className="mb-8">
                            <div className="relative mb-6">
                                {/* Animated background circle */}
                                <div className="w-24 h-24 mx-auto relative">
                                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 opacity-20 animate-pulse"></div>
                                    <div className="absolute inset-2 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center">
                                        {currentStep.icon}
                                    </div>
                                </div>
                            </div>

                            {/* Current step info */}
                            <div className="space-y-2 mb-6">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 transition-all duration-500">
                                    {currentStep.title}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 transition-all duration-500">
                                    {currentStep.subtitle}
                                </p>
                            </div>

                            {/* Progress bar */}
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
                                <div
                                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300 ease-out"
                                    style={{ width: `${Math.min(progress, 100)}%` }}
                                ></div>
                            </div>

                            {/* Step indicators */}
                            <div className="flex justify-center space-x-2">
                                {loadingSteps.map((step, index) => (
                                    <div
                                        key={step.id}
                                        className={`w-2 h-2 rounded-full transition-all duration-300 ${index <= currentStepIndex
                                                ? 'bg-blue-500 scale-110'
                                                : 'bg-gray-300 dark:bg-gray-600'
                                            }`}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Loading spinner */}
                        <div className="flex justify-center mb-4">
                            <LoadingSpinner className="w-8 h-8 text-blue-500" />
                        </div>

                        {/* Loading status */}
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                            Step {currentStepIndex + 1} of {loadingSteps.length}
                        </div>
                    </div>

                    {/* Calendar tips section */}
                    {showTips && showCalendarTips && (
                        <div className="mt-6 transition-all duration-1000 ease-in-out transform">
                            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-400/10 dark:to-purple-400/10 rounded-xl p-6 border border-blue-200/50 dark:border-blue-700/50">
                                <div className="flex items-start space-x-4">
                                    <div className="flex-shrink-0 mt-1">
                                        {currentTip.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1 transition-all duration-500">
                                            💡 {currentTip.title}
                                        </h4>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 transition-all duration-500">
                                            {currentTip.description}
                                        </p>
                                    </div>
                                </div>

                                {/* Tip indicators */}
                                <div className="flex justify-center space-x-1 mt-4">
                                    {calendarTips.map((_, index) => (
                                        <div
                                            key={index}
                                            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${index === currentTipIndex
                                                    ? 'bg-blue-500 scale-125'
                                                    : 'bg-gray-300 dark:bg-gray-600'
                                                }`}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Additional info footer */}
                    <div className="mt-6 text-center">
                        <div className="flex items-center justify-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                            <Github className="w-3 h-3" />
                            <span>Securely connected to GitHub API</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default LoadingScreen 