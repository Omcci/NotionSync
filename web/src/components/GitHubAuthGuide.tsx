import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import signInWithGitHub from '@/lib/login'
import {
  Shield,
  Users,
  GitBranch,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  ArrowRight,
  Info,
} from 'lucide-react'
import { GithubIcon } from '../../public/icon/GithubIcon'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog'
import { GitHubAuthGuideProps } from '../../types/ui'

const GitHubAuthGuide: React.FC<GitHubAuthGuideProps> = ({ onComplete }) => {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  const handleLogin = async () => {
    try {
      const result = await signInWithGitHub()
      onComplete?.()
    } catch (error) {
      console.error('GitHub auth error:', error)
    }
  }

  const handleConnectClick = () => {
    setShowConfirmDialog(true)
  }

  const handleConfirmConnect = () => {
    setShowConfirmDialog(false)
    handleLogin()
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mb-4">
          <GithubIcon className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Connect Your GitHub Account</h1>
        <p className="text-gray-600 dark:text-gray-300 text-lg">
          Let&apos;s set up your GitHub integration to start syncing your
          repositories with Notion
        </p>
      </div>

      {/* What happens during authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Info className="w-5 h-5" />
            <span>What Happens During Authentication</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col items-center text-center p-4 border rounded-lg">
              <Shield className="w-8 h-8 text-blue-600 mb-2" />
              <h3 className="font-semibold mb-1">Secure OAuth</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                GitHub&apos;s secure OAuth flow protects your credentials
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-4 border rounded-lg">
              <Users className="w-8 h-8 text-green-600 mb-2" />
              <h3 className="font-semibold mb-1">Organization Access</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Choose which organizations to grant access to
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-4 border rounded-lg">
              <GitBranch className="w-8 h-8 text-purple-600 mb-2" />
              <h3 className="font-semibold mb-1">Repository Access</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Access to your repositories for syncing
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Permissions explanation */}
      <Card>
        <CardHeader>
          <CardTitle>Permissions We Request</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium">Repository Access (repo)</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Read access to your repositories, commits, and branches for
                  syncing with Notion
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium">Organization Access (read:org)</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Read access to organization information and membership
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium">User Information (read:user)</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Basic profile information for account setup
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Organization selection guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Organization Selection Guide</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-800 dark:text-blue-200">
                  Important: Organization Access
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  When you click &quot;Connect GitHub Account&quot; below,
                  you&apos;ll be redirected to GitHub&apos;s authorization page.
                  There, GitHub will show you a list of organizations you belong
                  to and you can choose which ones to grant NotionSync access
                  to.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium">What you&apos;ll see:</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <span>A list of organizations you&apos;re a member of</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <span>
                  Checkboxes to grant or deny access to each organization
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <span>Your personal repositories are always accessible</span>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
                  Can&apos;t Change Later?
                </h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  Don&apos;t worry! You can always update your organization
                  permissions later through the &quot;GitHub Access&quot; tab in
                  Settings.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security note */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Security & Privacy</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-green-700 dark:text-green-300">
                ✓ We DO
              </h4>
              <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                <li>• Read your repository information</li>
                <li>• Access commit history and branches</li>
                <li>• Sync data with your Notion workspace</li>
                <li>• Store minimal data for sync purposes</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-red-700 dark:text-red-300">
                ✗ We DON&apos;T
              </h4>
              <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                <li>• Modify your repositories or code</li>
                <li>• Share your data with third parties</li>
                <li>• Store your GitHub credentials</li>
                <li>• Access private information unnecessarily</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogTrigger asChild>
            <Button
              size="lg"
              onClick={handleConnectClick}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold"
            >
              <GithubIcon className="w-5 h-5 mr-2" />
              Connect GitHub Account
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ready to Connect GitHub?</DialogTitle>
              <DialogDescription>
                You&apos;ll be redirected to GitHub&apos;s secure authorization
                page where you can:
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">
                    Review the permissions NotionSync is requesting
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">
                    Choose which organizations to grant access to
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">
                    Authorize the connection securely
                  </span>
                </div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>Remember:</strong> You can always modify your
                  organization permissions later in Settings → GitHub Access.
                </p>
              </div>
              <div className="flex space-x-3">
                <Button onClick={handleConfirmConnect} className="flex-1">
                  <GithubIcon className="w-4 h-4 mr-2" />
                  Continue to GitHub
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmDialog(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        <Button
          variant="outline"
          size="lg"
          onClick={() =>
            window.open(
              'https://docs.github.com/en/developers/apps/managing-oauth-apps/authorizing-oauth-apps',
              '_blank',
            )
          }
          className="px-8 py-4 text-lg font-semibold"
        >
          <ExternalLink className="w-5 h-5 mr-2" />
          Learn More
        </Button>
      </div>
    </div>
  )
}

export default GitHubAuthGuide
