import type { NextApiRequest, NextApiResponse } from 'next'
import { GitHubOrganizationAPI, Organization } from '../../../../types/github'

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' })
    }
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.error('Missing or invalid authorization header')
        return res.status(401).json({ message: 'Unauthorized' })
    }
    const githubToken = authHeader.split(' ')[1]
    try {
        // Fetch user's organizations
        const orgsResponse = await fetch('https://api.github.com/user/orgs', {
            headers: {
                Authorization: `token ${githubToken}`,
                Accept: 'application/vnd.github.v3+json',
                'User-Agent': 'NotionSync-App'
            },
        })
        if (!orgsResponse.ok) {
            const errorText = await orgsResponse.text()
            console.error('GitHub orgs API error:', errorText)
            throw new Error(`GitHub API error: ${orgsResponse.status} - ${errorText}`)
        }
        const organizations: GitHubOrganizationAPI[] = await orgsResponse.json()
        // Get detailed information for each organization
        const organizationDetails = await Promise.all(
            organizations.map(async (org) => {
                try {
                    // Get user's membership in this organization
                    const membershipResponse = await fetch(
                        `https://api.github.com/orgs/${org.login}/memberships/${await getUserLogin(githubToken)}`,
                        {
                            headers: {
                                Authorization: `token ${githubToken}`,
                                Accept: 'application/vnd.github.v3+json',
                                'User-Agent': 'NotionSync-App'
                            },
                        }
                    )
                    let role: string | undefined = undefined
                    let permissions: { admin: boolean; push: boolean; pull: boolean } | undefined = undefined
                    if (membershipResponse.ok) {
                        const membership = await membershipResponse.json()
                        role = membership.role || 'member'
                        permissions = {
                            admin: role === 'admin',
                            push: true,
                            pull: true
                        }
                    } else {
                        role = 'member'
                        permissions = { admin: false, push: true, pull: true }
                    }
                    const orgSummary: Organization = {
                        id: org.id.toString(),
                        login: org.login,
                        avatar_url: org.avatar_url,
                        description: org.description,
                        html_url: org.html_url,
                        public_repos: org.public_repos,
                        total_private_repos: org.total_private_repos,
                        created_at: org.created_at,
                        role,
                        permissions,
                    }
                    return orgSummary
                } catch (error) {
                    console.error(`Error fetching details for org ${org.login}:`, error)
                    const basicOrg: Organization = {
                        id: org.id.toString(),
                        login: org.login,
                        avatar_url: org.avatar_url,
                        description: org.description,
                        html_url: org.html_url,
                        public_repos: org.public_repos,
                        total_private_repos: org.total_private_repos,
                        created_at: org.created_at,
                        role: 'member',
                        permissions: { admin: false, push: true, pull: true },
                    }
                    return basicOrg
                }
            })
        )
        res.status(200).json({
            organizations: organizationDetails,
            total: organizationDetails.length,
        })
    } catch (error) {
        console.error('Error in organizations API handler:', error)
        res.status(500).json({
            message: 'Failed to fetch organizations',
            error: error instanceof Error ? error.message : 'Unknown error',
        })
    }
}

async function getUserLogin(githubToken: string): Promise<string> {
    const userResponse = await fetch('https://api.github.com/user', {
        headers: {
            Authorization: `token ${githubToken}`,
            Accept: 'application/vnd.github.v3+json',
            'User-Agent': 'NotionSync-App'
        },
    })
    if (!userResponse.ok) {
        const errorText = await userResponse.text()
        console.error('GitHub user API error:', errorText)
        throw new Error(`Failed to fetch user info: ${userResponse.status} - ${errorText}`)
    }
    const user = await userResponse.json()
    return user.login
} 