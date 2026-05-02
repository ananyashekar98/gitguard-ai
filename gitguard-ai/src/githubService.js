const { Octokit } = require("@octokit/rest");
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

async function getDiff(repoOwnerAndName, prNumber) {
    const [owner, repo] = repoOwnerAndName.split('/');
    const { data } = await octokit.pulls.get({
        owner,
        repo,
        pull_number: prNumber,
        mediaType: { format: "diff" }, // Fetching the raw Diff [cite: 111]
    });
    return data;
}

async function postComment(repoOwnerAndName, prNumber, body) {
    const [owner, repo] = repoOwnerAndName.split('/');
    await octokit.issues.createComment({
        owner,
        repo,
        issue_number: prNumber,
        body: `### 🛡️ GitGuard AI Review\n\n${body}` // GitHub-flavored Markdown 
    });
}

module.exports = { getDiff, postComment };