import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useUser } from '@/context/UserContext'
import RepositoryManager from '@/components/RepositoryManager'
import GitHubAccessManager from '@/components/GitHubAccessManager'
import { LoadingSpinner } from '@/components/ui/loadingspinner'
import ModeToggle from '@/components/ModeToggle'
import {
    Settings as SettingsIcon,
    GitBranch,
    User,
    Bell,
    Shield,
    Palette,
    Database,
    Github,
    Sun,
    Moon,
    Monitor
} from 'lucide-react'
import { useTheme } from 'next-themes'
import Image from 'next/image'

const SettingsPage: React.FC = () => {
    const { user, isLoading } = useUser()
    const { theme, setTheme } = useTheme()
    const router = useRouter()
    const [activeTab, setActiveTab] = useState('repositories')

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/login')
        }
    }, [user, isLoading, router])

    useEffect(() => {
        // Handle URL tab parameter
        if (router.isReady && router.query.tab) {
            setActiveTab(router.query.tab as string)
        }
    }, [router.isReady, router.query.tab])

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <LoadingSpinner />
            </div>
        )
    }

    if (!user) {
        return null // Will redirect to login
    }

    const userInfo = user?.user_metadata || {}

    return (
        <div className="container mx-auto p-6 max-w-6xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Settings</h1>
                <p className="text-gray-600 dark:text-gray-300">
                    Manage your account, repositories, and sync preferences
                </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-6">
                    <TabsTrigger value="repositories" className="flex items-center space-x-2">
                        <GitBranch className="w-4 h-4" />
                        <span className="hidden sm:inline">Repositories</span>
                    </TabsTrigger>
                    <TabsTrigger value="github-access" className="flex items-center space-x-2">
                        <Github className="w-4 h-4" />
                        <span className="hidden sm:inline">GitHub Access</span>
                    </TabsTrigger>
                    <TabsTrigger value="profile" className="flex items-center space-x-2">
                        <User className="w-4 h-4" />
                        <span className="hidden sm:inline">Profile</span>
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="flex items-center space-x-2">
                        <Bell className="w-4 h-4" />
                        <span className="hidden sm:inline">Notifications</span>
                    </TabsTrigger>
                    <TabsTrigger value="appearance" className="flex items-center space-x-2">
                        <Palette className="w-4 h-4" />
                        <span className="hidden sm:inline">Appearance</span>
                    </TabsTrigger>
                    <TabsTrigger value="integrations" className="flex items-center space-x-2">
                        <Database className="w-4 h-4" />
                        <span className="hidden sm:inline">Integrations</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="repositories">
                    <RepositoryManager />
                </TabsContent>

                <TabsContent value="github-access">
                    <GitHubAccessManager />
                </TabsContent>

                <TabsContent value="profile">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <User className="w-5 h-5" />
                                <span>Profile Information</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center space-x-4">
                                {userInfo.avatar_url && (
                                    <Image
                                        src={userInfo.avatar_url}
                                        alt="Profile"
                                        width={80}
                                        height={80}
                                        className="rounded-full"
                                    />
                                )}
                                <div>
                                    <h3 className="text-xl font-semibold">{userInfo.full_name || userInfo.name || 'Unknown User'}</h3>
                                    <p className="text-gray-600 dark:text-gray-300">@{userInfo.user_name || userInfo.preferred_username}</p>
                                    <p className="text-sm text-gray-500">{user?.email}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">GitHub Username</label>
                                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        {userInfo.user_name || userInfo.preferred_username || 'Not available'}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Email</label>
                                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        {user?.email || 'Not available'}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Account Type</label>
                                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        <Badge variant="outline">GitHub OAuth</Badge>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Member Since</label>
                                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Not available'}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="notifications">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <Bell className="w-5 h-5" />
                                <span>Notification Preferences</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="font-medium">Sync Notifications</h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-300">
                                            Get notified when syncs complete or fail
                                        </p>
                                    </div>
                                    <input type="checkbox" className="toggle" defaultChecked />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="font-medium">New Repository Notifications</h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-300">
                                            Get notified when new repositories are detected
                                        </p>
                                    </div>
                                    <input type="checkbox" className="toggle" />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="font-medium">Weekly Summary</h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-300">
                                            Receive a weekly summary of your sync activity
                                        </p>
                                    </div>
                                    <input type="checkbox" className="toggle" defaultChecked />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="appearance">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <Palette className="w-5 h-5" />
                                <span>Appearance Settings</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="font-medium">Theme</h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-300">
                                            Choose your preferred color scheme
                                        </p>
                                    </div>
                                    <ModeToggle />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                                    <Button
                                        variant={theme === 'light' ? 'default' : 'outline'}
                                        onClick={() => setTheme('light')}
                                        className="h-24 flex flex-col items-center justify-center space-y-2"
                                    >
                                        <Sun className="w-6 h-6" />
                                        <span>Light</span>
                                        <div className="w-8 h-8 bg-white border-2 border-gray-300 rounded"></div>
                                    </Button>
                                    <Button
                                        variant={theme === 'dark' ? 'default' : 'outline'}
                                        onClick={() => setTheme('dark')}
                                        className="h-24 flex flex-col items-center justify-center space-y-2"
                                    >
                                        <Moon className="w-6 h-6" />
                                        <span>Dark</span>
                                        <div className="w-8 h-8 bg-gray-800 border-2 border-gray-600 rounded"></div>
                                    </Button>
                                    <Button
                                        variant={theme === 'system' ? 'default' : 'outline'}
                                        onClick={() => setTheme('system')}
                                        className="h-24 flex flex-col items-center justify-center space-y-2"
                                    >
                                        <Monitor className="w-6 h-6" />
                                        <span>System</span>
                                        <div className="w-8 h-8 bg-gradient-to-r from-white to-gray-800 border-2 border-gray-400 rounded"></div>
                                    </Button>
                                </div>

                                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                    <h5 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Current Theme: {theme}</h5>
                                    <p className="text-sm text-blue-700 dark:text-blue-300">
                                        {theme === 'system'
                                            ? 'Automatically matches your system preference'
                                            : theme === 'light'
                                                ? 'Light mode is active'
                                                : 'Dark mode is active'
                                        }
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="integrations">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <Database className="w-5 h-5" />
                                <span>Integrations</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="flex items-center space-x-3">
                                        <Github className="w-8 h-8" />
                                        <div>
                                            <h4 className="font-medium">GitHub</h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                                Connected as {userInfo.user_name || userInfo.preferred_username}
                                            </p>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="text-green-600 border-green-600">
                                        Connected
                                    </Badge>
                                </div>

                                <div className="flex items-center justify-between p-4 border rounded-lg opacity-50">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                                            <Database className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h4 className="font-medium">Notion</h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                                Sync your repositories to Notion databases
                                            </p>
                                        </div>
                                    </div>
                                    <Badge variant="outline">
                                        Coming Soon
                                    </Badge>
                                </div>

                                <div className="flex items-center justify-between p-4 border rounded-lg opacity-50">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                                            <Shield className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h4 className="font-medium">Slack</h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                                Get notifications in your Slack workspace
                                            </p>
                                        </div>
                                    </div>
                                    <Badge variant="outline">
                                        Coming Soon
                                    </Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}

export default SettingsPage 