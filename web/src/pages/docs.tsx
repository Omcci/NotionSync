import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
    ArrowRight,
    Github,
    Database,
    Zap,
    Shield,
    Clock,
    Users,
    CheckCircle,
    Play,
    Book,
    Settings,
    GitBranch,
    RefreshCw,
    Bell,
    Eye,
    Code,
    FileText,
    Calendar,
    BarChart3
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'
import Image from 'next/image'

const DocsPage: React.FC = () => {
    const [activeDemo, setActiveDemo] = useState('overview')

    const features = [
        {
            icon: <Github className="w-6 h-6" />,
            title: "GitHub Integration",
            description: "Seamlessly connect your GitHub repositories with one-click OAuth authentication"
        },
        {
            icon: <Database className="w-6 h-6" />,
            title: "Notion Sync",
            description: "Automatically sync repository data, commits, and issues to your Notion workspace"
        },
        {
            icon: <Zap className="w-6 h-6" />,
            title: "Real-time Updates",
            description: "Get instant notifications when your repositories change"
        },
        {
            icon: <Shield className="w-6 h-6" />,
            title: "Secure & Private",
            description: "Your data is encrypted and we only access what you explicitly allow"
        },
        {
            icon: <Clock className="w-6 h-6" />,
            title: "Automated Workflows",
            description: "Set up custom sync schedules and automation rules"
        },
        {
            icon: <Users className="w-6 h-6" />,
            title: "Team Collaboration",
            description: "Share synchronized data with your team members"
        }
    ]

    const steps = [
        {
            number: "01",
            title: "Connect GitHub",
            description: "Authenticate with GitHub and select which organizations and repositories you want to sync",
            icon: <Github className="w-8 h-8" />
        },
        {
            number: "02",
            title: "Configure Sync",
            description: "Choose what data to sync: commits, issues, pull requests, and more",
            icon: <Settings className="w-8 h-8" />
        },
        {
            number: "03",
            title: "Connect Notion",
            description: "Link your Notion workspace and select target databases",
            icon: <Database className="w-8 h-8" />
        },
        {
            number: "04",
            title: "Start Syncing",
            description: "Watch as your GitHub data automatically appears in Notion",
            icon: <RefreshCw className="w-8 h-8" />
        }
    ]

    const demoSections = [
        {
            id: 'overview',
            title: 'Platform Overview',
            icon: <Eye className="w-5 h-5" />,
            content: (
                <div className="space-y-6">
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-6 rounded-lg border">
                        <h3 className="text-xl font-semibold mb-4">What is NotionSync?</h3>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            NotionSync is a powerful integration platform that bridges the gap between your GitHub repositories
                            and Notion workspace. It automatically synchronizes your development data, making project management
                            and documentation effortless.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                                <Github className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                                <h4 className="font-medium">GitHub Data</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Repositories, commits, issues, PRs</p>
                            </div>
                            <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                                <ArrowRight className="w-8 h-8 mx-auto mb-2 text-green-600" />
                                <h4 className="font-medium">Sync Engine</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Real-time synchronization</p>
                            </div>
                            <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                                <Database className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                                <h4 className="font-medium">Notion Workspace</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Organized databases & pages</p>
                            </div>
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'authentication',
            title: 'GitHub Authentication',
            icon: <Shield className="w-5 h-5" />,
            content: (
                <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
                        <h3 className="text-xl font-semibold mb-4">Secure OAuth Integration</h3>
                        <div className="space-y-4">
                            <div className="flex items-start space-x-3">
                                <CheckCircle className="w-5 h-5 text-green-500 mt-1" />
                                <div>
                                    <h4 className="font-medium">One-Click Authentication</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Connect your GitHub account securely using OAuth 2.0
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start space-x-3">
                                <CheckCircle className="w-5 h-5 text-green-500 mt-1" />
                                <div>
                                    <h4 className="font-medium">Organization Selection</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Choose which organizations and repositories to sync
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start space-x-3">
                                <CheckCircle className="w-5 h-5 text-green-500 mt-1" />
                                <div>
                                    <h4 className="font-medium">Granular Permissions</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        We only request the minimum permissions needed
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start space-x-3">
                                <CheckCircle className="w-5 h-5 text-green-500 mt-1" />
                                <div>
                                    <h4 className="font-medium">Can&apos;t see private repos:</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Re-authorize to grant additional permissions
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'dashboard',
            title: 'Dashboard Features',
            icon: <BarChart3 className="w-5 h-5" />,
            content: (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <GitBranch className="w-5 h-5" />
                                    <span>Repository Management</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex items-center space-x-2">
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                        <span>View all connected repositories</span>
                                    </li>
                                    <li className="flex items-center space-x-2">
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                        <span>Monitor sync status</span>
                                    </li>
                                    <li className="flex items-center space-x-2">
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                        <span>Configure sync settings</span>
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <Calendar className="w-5 h-5" />
                                    <span>Activity Timeline</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex items-center space-x-2">
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                        <span>Recent commits and changes</span>
                                    </li>
                                    <li className="flex items-center space-x-2">
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                        <span>Sync history and logs</span>
                                    </li>
                                    <li className="flex items-center space-x-2">
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                        <span>Team activity overview</span>
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )
        },
        {
            id: 'sync',
            title: 'Sync Configuration',
            icon: <RefreshCw className="w-5 h-5" />,
            content: (
                <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
                        <h3 className="text-xl font-semibold mb-4">Flexible Sync Options</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="font-medium mb-3">Data Types</h4>
                                <div className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                        <input type="checkbox" defaultChecked className="rounded" />
                                        <span className="text-sm">Repository metadata</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <input type="checkbox" defaultChecked className="rounded" />
                                        <span className="text-sm">Commit history</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <input type="checkbox" defaultChecked className="rounded" />
                                        <span className="text-sm">Issues and pull requests</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <input type="checkbox" className="rounded" />
                                        <span className="text-sm">Code analysis</span>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h4 className="font-medium mb-3">Sync Frequency</h4>
                                <div className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                        <input type="radio" name="frequency" defaultChecked />
                                        <span className="text-sm">Real-time</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <input type="radio" name="frequency" />
                                        <span className="text-sm">Every hour</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <input type="radio" name="frequency" />
                                        <span className="text-sm">Daily</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <input type="radio" name="frequency" />
                                        <span className="text-sm">Manual only</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )
        }
    ]

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
            {/* Hero Section */}
            <motion.section
                className="py-20 px-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
            >
                <div className="max-w-7xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        <Badge variant="outline" className="mb-4 px-4 py-2">
                            <Book className="w-4 h-4 mr-2" />
                            Documentation & Demo
                        </Badge>
                        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
                            How NotionSync
                            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Works</span>
                        </h1>
                        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
                            Discover how to seamlessly integrate your GitHub repositories with Notion,
                            automate your workflow, and boost your team&apos;s productivity.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button size="lg" asChild>
                                <Link href="/login">
                                    <Play className="w-5 h-5 mr-2" />
                                    Try It Now
                                </Link>
                            </Button>
                            <Button variant="outline" size="lg" asChild>
                                <Link href="#features">
                                    <Eye className="w-5 h-5 mr-2" />
                                    Explore Features
                                </Link>
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </motion.section>

            {/* Features Overview */}
            <motion.section
                id="features"
                className="py-20 px-6 bg-white dark:bg-gray-800"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
            >
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
                            Powerful Features
                        </h2>
                        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                            Everything you need to connect your development workflow with your documentation
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: index * 0.1 }}
                                viewport={{ once: true }}
                                whileHover={{ scale: 1.05 }}
                                className="bg-gray-50 dark:bg-gray-700 p-6 rounded-xl"
                            >
                                <div className="text-blue-600 dark:text-blue-400 mb-4">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                                    {feature.title}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300">
                                    {feature.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </motion.section>

            {/* How It Works */}
            <motion.section
                className="py-20 px-6"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
            >
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
                            How It Works
                        </h2>
                        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                            Get started in just four simple steps
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {steps.map((step, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: index * 0.2 }}
                                viewport={{ once: true }}
                                className="text-center"
                            >
                                <div className="relative mb-6">
                                    <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
                                        {step.number}
                                    </div>
                                    <div className="text-blue-600 dark:text-blue-400 flex justify-center">
                                        {step.icon}
                                    </div>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                                    {step.title}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300">
                                    {step.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </motion.section>

            {/* Interactive Demo */}
            <motion.section
                className="py-20 px-6 bg-white dark:bg-gray-800"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
            >
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
                            Interactive Demo
                        </h2>
                        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                            Explore the platform features and see how everything works together
                        </p>
                    </div>

                    <Tabs value={activeDemo} onValueChange={setActiveDemo} className="space-y-8">
                        <TabsList className="grid w-full grid-cols-4">
                            {demoSections.map((section) => (
                                <TabsTrigger key={section.id} value={section.id} className="flex items-center space-x-2">
                                    {section.icon}
                                    <span className="hidden sm:inline">{section.title}</span>
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        {demoSections.map((section) => (
                            <TabsContent key={section.id} value={section.id}>
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    {section.content}
                                </motion.div>
                            </TabsContent>
                        ))}
                    </Tabs>
                </div>
            </motion.section>

            {/* CTA Section */}
            <motion.section
                className="py-20 px-6 bg-gradient-to-r from-blue-600 to-purple-600"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
            >
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-4xl font-bold text-white mb-6">
                        Ready to Get Started?
                    </h2>
                    <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                        Join thousands of developers who have streamlined their workflow with NotionSync
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button size="lg" variant="secondary" asChild>
                            <Link href="/login">
                                <Github className="w-5 h-5 mr-2" />
                                Start Free with GitHub
                            </Link>
                        </Button>
                        <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600" asChild>
                            <Link href="/contact">
                                <Bell className="w-5 h-5 mr-2" />
                                Contact Sales
                            </Link>
                        </Button>
                    </div>
                </div>
            </motion.section>
        </div>
    )
}

export default DocsPage 