const { Octokit } = require('@octokit/rest');

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

async function fetchPRDiff(repoFullName, prNumber) {
  const [owner, repo] = repoFullName.split('/');

  const { data: files } = await octokit.pulls.listFiles({
    owner,
    repo,
    pull_number: prNumber,
  });

  let diffContent = '';

  for (const file of files) {
    if (!file.patch) continue;

    diffContent += `\n\n### File: ${file.filename}\n`;
    diffContent += `Status: ${file.status} (+${file.additions} additions, -${file.deletions} deletions)\n`;
    diffContent += '```diff\n';
    diffContent += file.patch;
    diffContent += '\n```';
  }

  console.log(`📄 Fetched diff for ${files.length} file(s)`);
  return diffContent;
}

async function postPRComment(repoFullName, prNumber, comment) {
  const [owner, repo] = repoFullName.split('/');

  await octokit.issues.createComment({
    owner,
    repo,
    issue_number: prNumber,
    body: comment,
  });

  console.log(`💬 Comment posted to PR #${prNumber}`);
}

module.exports = { fetchPRDiff, postPRComment };