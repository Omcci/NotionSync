import { Users, GitBranch, Shield, Clock } from 'lucide-react';

export const stats = [
    { number: '10K+', label: 'Active Users', icon: <Users className="w-6 h-6" /> },
    { number: '50K+', label: 'Synced Commits', icon: <GitBranch className="w-6 h-6" /> },
    { number: '99.9%', label: 'Uptime', icon: <Shield className="w-6 h-6" /> },
    { number: '24/7', label: 'Support', icon: <Clock className="w-6 h-6" /> },
];

export const benefits = [
    'Automatic GitHub to Notion synchronization',
    'Real-time collaboration tracking',
    'Smart project insights and analytics',
    'Customizable workflow automation',
    'Enterprise-grade security',
    'Seamless team onboarding'
];

export const testimonials = [
    {
        name: 'Sarah Chen',
        role: 'Engineering Manager',
        company: 'TechCorp',
        content: 'NotionSync transformed how our team tracks progress. We\'ve seen a 40% improvement in project visibility.',
        avatar: '/placeholder-user.jpg'
    },
    {
        name: 'Marcus Rodriguez',
        role: 'Product Lead',
        company: 'StartupXYZ',
        content: 'The seamless integration between GitHub and Notion has streamlined our entire development workflow.',
        avatar: '/placeholder-user.jpg'
    },
    {
        name: 'Emily Watson',
        role: 'CTO',
        company: 'InnovateLabs',
        content: 'Finally, a tool that bridges the gap between development and project management perfectly.',
        avatar: '/placeholder-user.jpg'
    }
]; 