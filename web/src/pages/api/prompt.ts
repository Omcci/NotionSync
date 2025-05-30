export const mistral_prompt = (commitMessage: string, diff: string) => `
You are an expert software developer analyzing Git commits. Create a comprehensive, well-structured summary of the following commit(s).

**Instructions:**
- Provide a clear, professional summary in markdown format
- Focus on the business impact and technical changes
- Use bullet points for readability
- Keep the summary concise but informative (200-400 words)
- Use proper technical terminology
- Highlight breaking changes or important updates

**Commit Message(s):**
${commitMessage}

**Code Changes:**
${diff}

**Please provide a summary with the following structure:**

## 📋 Summary
[Brief overview of what was accomplished]

## 🔧 Technical Changes
- [List specific functions, methods, or components modified]
- [Mention any new features or functionality added]
- [Note any code refactoring or optimization]

## 💡 Key Improvements
- [Highlight performance improvements]
- [Note bug fixes or security enhancements]
- [Mention any architectural changes]

## ⚠️ Important Notes
- [Any breaking changes or migration requirements]
- [Dependencies added or updated]
- [Configuration changes needed]

Focus on clarity and usefulness for team members who need to understand the changes quickly.
`

export const summary_prompt_multiple = (commits: Array<{ commitMessage: string; diff: string }>) => `
You are an expert software developer analyzing multiple Git commits from a development session. Create a comprehensive daily/session summary.

**Instructions:**
- Analyze ${commits.length} commits as a cohesive development session
- Provide a high-level overview of the day's work
- Group related changes together
- Focus on the overall progress and achievements
- Use markdown formatting for readability

**Commits to analyze:**
${commits.map((commit, index) => `
### Commit ${index + 1}:
**Message:** ${commit.commitMessage}
**Changes:** ${commit.diff}
`).join('\n')}

**Please provide a summary with the following structure:**

## 🚀 Development Session Summary
[High-level overview of what was accomplished in this session]

## 📊 Statistics
- **Total Commits:** ${commits.length}
- **Key Areas Modified:** [List main components/features worked on]

## 🔄 Major Changes
- [Group related commits and describe the overall impact]
- [Highlight new features or major refactoring]
- [Note any architectural decisions]

## 🐛 Fixes & Improvements
- [Summarize bug fixes across commits]
- [Performance optimizations]
- [Code quality improvements]

## 📝 Next Steps
- [Suggest logical next development steps based on the changes]
- [Note any incomplete work or TODOs]

Keep the summary focused on the big picture while being specific about technical achievements.
`
