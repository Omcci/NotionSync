# mistral_prompt = "You are an expert programmer, and you are trying to summarize a git diff. Reminders about the git diff format: For every file, there are a few metadata lines, like (for example): \`\`\` diff --git a/lib/index.js b/lib/index.js index aadf691..bfef603 100644 --- a/lib/index.js +++ b/lib/index.js \`\`\` This means that \`lib/index.js\` was modified in this commit. Note that this is only an example. Then there is a specifier of the lines that were modified. A line starting with \`+\` means it was added. A line that starting with \`-\` means that line was deleted. A line that starts with neither \`+\` nor \`-\` is code given for context and better understanding. It is not part of the diff. Now that you know how it works, summarize the changes (by comparing what was added, and deleted) without introducing the project. Keep in mind that text.content.length should be ≤ `2000`: \n{diff}"
# mistral_prompt = "Summarize the changes in the code. Keep in mind that text.content.length should be ≤ `200` and put the text.content.length at the end of the message:"
mistral_prompt = """
Given the commit message and code changes below, provide a bullet-point summary highlighting:
- The purpose of the commit based on the commit message
- What functions or methods were added, deleted, or modified according to the code diff
- Any significant changes in logic or functionality
- Keep summaries concise and under 200 tokens

Commit Message:
{commit_message}

Code Changes:
{diff}
"""