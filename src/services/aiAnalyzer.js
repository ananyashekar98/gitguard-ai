const Groq = require('groq-sdk');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

async function analyzeCode(diff, options = {}) {
  const { strictMode = false, ignoreStyling = false } = options;

  let focusInstructions = '';
  if (strictMode) focusInstructions = 'Apply STRICT analysis. Flag all issues including minor ones.';
  if (ignoreStyling) focusInstructions += ' Do NOT report code style or formatting issues.';

  const prompt = `You are GitGuard AI, an expert code reviewer. Analyze the following Pull Request diff and provide a thorough review.

${focusInstructions}

Look for:
1. Bugs - Logic errors, off-by-one errors, null pointer issues, incorrect conditions
2. Security vulnerabilities - SQL injection, XSS, exposed secrets, improper validation
3. Performance issues - Unnecessary loops, memory leaks
4. Code quality - Missing error handling, dead code

Format your response EXACTLY like this using GitHub Markdown:

## 🛡️ GitGuard AI Review

### Summary
[One sentence summary of the PR and your overall assessment]

### 🔴 Critical Issues
[Bugs or security vulnerabilities. If none, write "None found."]
For each issue:
- **Issue**: [description]
- **Location**: [filename and line]
- **Fix**:
\`\`\`
[corrected code]
\`\`\`

### 🟡 Warnings
[Performance or code quality problems. If none, write "None found."]

### 🟢 Suggestions
[Optional improvements. If none, write "None."]

### ✅ Verdict
[APPROVED / NEEDS CHANGES / CRITICAL]

---
*Reviewed by GitGuard AI 🛡️*

Here is the PR diff:

${diff}`;

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }]
  });

  return response.choices[0].message.content;
}

module.exports = { analyzeCode };