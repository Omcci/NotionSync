import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import {
    CheckCircle,
    ArrowRight,
    Settings,
    GitBranch,
    Users,
    Calendar
} from 'lucide-react'
import { useRouter } from 'next/router'
import { useUser } from '@/context/UserContext'
import Image from 'next/image'

const AuthSuccessGuide: React.FC = () => {
    const router = useRouter()
    const { user } = useUser()
    const userInfo = user?.user_metadata || {}

    const nextSteps = [
        {
            icon: <GitBranch className="w-5 h-5" />,
            title: "Select Repositories",
            description: "Choose which repositories you want to sync with Notion",
            action: "Go to Settings → Repositories",
            href: "/settings?tab=repositories"
        },
        {
            icon: <Users className="w-5 h-5" />,
            title: "Manage Organization Access",
            description: "Review and update your GitHub organization permissions",
            action: "Go to Settings → GitHub Access",
            href: "/settings?tab=github-access"
        },
        {
            icon: <Calendar className="w-5 h-5" />,
            title: "Start Syncing",
            description: "Begin syncing your GitHub activity with Notion",
            action: "Go to Dashboard",
            href: "/dashboardv0"
        }
    ]

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="text-center">
                <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h1 className="text-3xl font-bold mb-2">Welcome to NotionSync! 🎉</h1>
                <p className="text-gray-600 dark:text-gray-300 text-lg">
                    Your GitHub account has been successfully connected
                </p>
            </div>

            {/* User Info */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span>Connected Account</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center space-x-4">
                        {userInfo.avatar_url && (
                            <Image
                                src={userInfo.avatar_url}
                                alt="GitHub Avatar"
                                width={48}
                                height={48}
                                className="rounded-full"
                            />
                        )}
                        <div>
                            <h3 className="font-semibold">
                                {userInfo.full_name || userInfo.name || 'GitHub User'}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300">
                                @{userInfo.user_name || userInfo.preferred_username}
                            </p>
                            <Badge variant="outline" className="text-green-600 mt-1">
                                Successfully Connected
                            </Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Next Steps */}
            <Card>
                <CardHeader>
                    <CardTitle>What&apos;s Next?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {nextSteps.map((step, index) => (
                        <div key={index} className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400">
                                {step.icon}
                            </div>
                            <div className="flex-1">
                                <h4 className="font-semibold mb-1">{step.title}</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                    {step.description}
                                </p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => router.push(step.href)}
                                >
                                    {step.action}
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                    size="lg"
                    onClick={() => router.push('/dashboardv0')}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4"
                >
                    Go to Dashboard
                    <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button
                    variant="outline"
                    size="lg"
                    onClick={() => router.push('/settings')}
                    className="px-8 py-4"
                >
                    <Settings className="w-5 h-5 mr-2" />
                    Manage Settings
                </Button>
            </div>
        </div>
    )
}

export default AuthSuccessGuide 