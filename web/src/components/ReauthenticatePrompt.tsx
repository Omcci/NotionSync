import React from 'react'
import { AlertTriangle } from 'lucide-react'
import signInWithGitHub from '@/lib/login'
import { ReauthenticatePromptProps } from '../../types'
import { GithubIcon } from '../../public/icon/GithubIcon'

export const ReauthenticatePrompt: React.FC<ReauthenticatePromptProps> = ({
    reason = 'GitHub access required',
    onReauthenticate
}) => {
    const handleReauthenticate = async () => {
        try {
            await signInWithGitHub(true)
            onReauthenticate?.()
        } catch (error) {
            console.error('Error re-authenticating with GitHub:', error)
        }
    }

    const getTitle = () => {
        if (reason.includes('invalid') || reason.includes('expired')) {
            return 'GitHub Token Expired'
        }
        return 'GitHub Access Required'
    }

    const getMessage = () => {
        if (reason.includes('invalid') || reason.includes('expired')) {
            return 'Your GitHub token has expired or been revoked. Please re-authenticate to continue accessing your repositories.'
        }
        return 'Your GitHub authentication is missing. Please authenticate to access your repositories.'
    }

    return (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 max-w-md mx-auto">
            <div className="flex items-center space-x-3 mb-4">
                <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200">
                    {getTitle()}
                </h3>
            </div>

            <p className="text-yellow-700 dark:text-yellow-300 mb-4">
                {getMessage()}
            </p>

            <button
                onClick={handleReauthenticate}
                className="w-full flex items-center justify-center space-x-2 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg transition-colors"
            >
                <GithubIcon className="h-5 w-5" />
                <span>Re-authenticate with GitHub</span>
            </button>
        </div>
    )
} 