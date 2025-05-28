import React from 'react'
import { GitBranch, Settings, Zap } from 'lucide-react'
import { GithubIcon } from '../../../../public/icon/GithubIcon'

const WelcomeStep: React.FC = () => {
  return (
    <div className="text-center space-y-6">
      <div className="w-20 h-20 mx-auto bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
        <GithubIcon className="w-10 h-10 text-white" />
      </div>
      <div>
        <h2 className="text-2xl font-bold mb-2">Welcome to NotionSync!</h2>
        <p className="text-gray-600 dark:text-gray-300">
          We&apos;ll help you connect your GitHub repositories with Notion in
          just a few simple steps.
        </p>
        <p className="text-sm text-gray-500 mt-2">
          You can also skip this setup and explore the app first.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <div className="flex flex-col items-center p-4 border rounded-lg">
          <GitBranch className="w-8 h-8 text-blue-600 mb-2" />
          <h3 className="font-semibold">Select Repos</h3>
          <p className="text-sm text-gray-500 text-center">
            Choose which repositories to sync
          </p>
        </div>
        <div className="flex flex-col items-center p-4 border rounded-lg">
          <Settings className="w-8 h-8 text-green-600 mb-2" />
          <h3 className="font-semibold">Configure</h3>
          <p className="text-sm text-gray-500 text-center">
            Set up your sync preferences
          </p>
        </div>
        <div className="flex flex-col items-center p-4 border rounded-lg">
          <Zap className="w-8 h-8 text-purple-600 mb-2" />
          <h3 className="font-semibold">Start Syncing</h3>
          <p className="text-sm text-gray-500 text-center">
            Begin automatic synchronization
          </p>
        </div>
      </div>
    </div>
  )
}

export default WelcomeStep
