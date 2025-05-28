import React from 'react'
import { CheckCircle } from 'lucide-react'

const CompletionStep: React.FC = () => {
    return (
        <div className="text-center space-y-6">
            <div className="w-20 h-20 mx-auto bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <div>
                <h2 className="text-2xl font-bold mb-2">You&apos;re All Set! 🚀</h2>
                <p className="text-gray-600 dark:text-gray-300">
                    Your NotionSync is configured and ready to go. You can now start syncing your GitHub activity with Notion.
                </p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <h3 className="font-semibold mb-2">What&apos;s Next?</h3>
                <ul className="text-sm text-left space-y-1">
                    <li>• Visit the Dashboard to select repositories and branches</li>
                    <li>• Configure your Notion integration in Settings</li>
                    <li>• Start your first sync to see your commits in Notion</li>
                    <li>• Use the Calendar view to explore your commit history</li>
                </ul>
            </div>
        </div>
    )
}

export default CompletionStep 