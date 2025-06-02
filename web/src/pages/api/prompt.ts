export const mistral_prompt = (commitMessage: string, diff: string) => `
You are an expert software developer analyzing Git commits. Create an engaging, well-structured summary of what was actually accomplished.

**Instructions:**
- Tell the story of what was built or changed in this commit
- Focus on functionality, user experience, and problem-solving
- Use different text sizes for different levels of importance
- Keep it engaging and readable for both technical and non-technical readers
- Base everything on actual code changes - no generic advice
- Explain the "why" and "what" behind the changes

**Commit Message(s):**
${commitMessage}

**Code Changes:**
${diff}

**Please provide a summary with the following structure:**

## 📋 What Was Accomplished
[Tell the story of what was actually built or changed in this commit]

## 🔧 How It Works
- [Explain the key functionality that was implemented]
- [Describe how the solution works without listing file names]
- [Focus on the logic and approach used]

## 💡 Problems Solved
- [What specific issues or challenges were addressed]
- [How the implementation improves the existing system]
- [What edge cases or scenarios are now handled]

## ⚠️ Important Changes
- [Any significant behavior changes users will notice]
- [New dependencies or requirements introduced]
- [Breaking changes that affect how things work]

## 🎯 Key Implementation Details
- [Interesting technical approaches or patterns used]
- [Smart solutions or optimizations implemented]
- [Areas where special attention was given based on the code]

Make it read like a story of actual work accomplished, not a technical specification.
`

export const summary_prompt_multiple = (commits: Array<{ commitMessage: string; diff: string }>) => `
You are an expert software developer analyzing a development session. Create an engaging summary of what was actually accomplished across ${commits.length} commits.

**Instructions:**
- Tell the cohesive story of this development session
- Focus on what functionality was built, what problems were solved
- Make it interesting and readable for anyone to understand
- Group related work together logically
- Base everything on actual code changes - no generic advice
- Show the progression and evolution of the work

**Commits to analyze:**
${commits.map((commit, index) => `
### Commit ${index + 1}:
**Message:** ${commit.commitMessage}
**Changes:** ${commit.diff}
`).join('\n')}

**Please provide a summary with the following structure:**

## 🚀 Development Session Story
[Tell the overarching story of what was accomplished in this session]

## 📊 Session Overview
- **Commits Made:** ${commits.length}
- **Main Features Built:** [What major functionality was developed]
- **Key Problems Solved:** [What issues were tackled]

## 🔄 Major Accomplishments
- [Group related work and explain what was built/changed]
- [Describe new features or improvements made]
- [Explain how different pieces fit together]

## 🐛 Issues Resolved
- [What specific bugs or problems were fixed]
- [Performance improvements that were made]
- [User experience enhancements implemented]

## 🎯 Session Highlights
- [Most interesting or complex work done in this session]
- [Clever solutions or approaches taken]
- [Significant functionality that was completed]
- [Key milestones reached in the development]

AI personal note:
Write it like a progress report that shows real work accomplished, not a dry technical document.
`
