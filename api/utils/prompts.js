export const mistral_prompt = (commitMessage, diff) => `
Given the commit message and code changes below, provide a bullet-point summary highlighting:
- The purpose of the commit based on the commit message
- What functions or methods were added, deleted, or modified according to the code diff
- Any significant changes in logic or functionality
- Keep summaries concise and under 200 tokens

Commit Message:
${commitMessage}

Code Changes:
${diff}
`;
