require('dotenv').config();
const express = require('express');
const crypto = require('crypto');
const path = require('path');
const { Octokit } = require('@octokit/rest');
const Groq = require('groq-sdk');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Groq AI
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Initialize GitHub client
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

// In-memory store for reviews
const reviewHistory = [];

app.use(express.json({
  verify: (req, res, buf) => { req.rawBody = buf; }
}));

// ---- FUNCTION 1: Verify GitHub webhook signature (security) ----
function verifyGitHubSignature(req) {
  const sig = req.headers['x-hub-signature-256'];
  if (!sig) return false;
  const hmac = crypto.createHmac('sha256', process.env.WEBHOOK_SECRET);
  const digest = 'sha256=' + hmac.update(req.rawBody).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(digest));
}

// ---- FUNCTION 2: Fetch the PR diff from GitHub ----
async function getPRDiff(owner, repo, pull_number) {
  console.log('📥 Fetching PR diff from GitHub...');
  const response = await octokit.request(
    'GET /repos/{owner}/{repo}/pulls/{pull_number}',
    {
      owner,
      repo,
      pull_number,
      headers: { accept: 'application/vnd.github.v3.diff' }
    }
  );
  return response.data;
}

// ---- FUNCTION 3: Send diff to Groq AI and get review ----
async function analyzeWithGroq(diff) {
  console.log('🤖 Sending code to Groq AI for review...');

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'user',
        content: `You are a senior software engineer and expert code reviewer at a top tech company. Analyze this GitHub Pull Request diff carefully.

Your review MUST include these sections:

## 📋 Summary
What does this PR change? (2-3 sentences max)

## 🐛 Bugs Found
List any bugs or logic errors with line references. If none, write "✅ No bugs found."

## 🔒 Security Issues
List any security vulnerabilities (SQL injection, XSS, exposed secrets, etc). If none, write "✅ No security issues found."

## ⚡ Performance Issues
List any performance problems. If none, write "✅ No performance issues found."

## 💡 Code Quality Suggestions
List 2-3 specific improvements for readability or best practices.

## ✅ Fixed Code
For each bug found, show the corrected code in a properly labeled code block.

## 📊 Review Score
Rate this PR: ⭐⭐⭐⭐⭐ (1-5 stars) with one sentence reason.

Be specific, helpful, and professional. Format in GitHub Markdown.

Here is the diff:

\`\`\`diff
${diff}
\`\`\``
      }
    ],
    max_tokens: 1000
  });

  return completion.choices[0].message.content;
}

// ---- FUNCTION 4: Count bugs from AI review response ----
function countBugs(reviewText) {
  const bugsSection = reviewText.match(/## 🐛 Bugs Found([\s\S]*?)## /);
  if (!bugsSection) return 0;
  const content = bugsSection[1];
  if (content.toLowerCase().includes('no bugs found')) return 0;
  if (content.includes('✅')) return 0;
  const matches = content.match(/^\d+\./gm);
  return matches ? matches.length : 0;
}

// ---- FUNCTION 5: Post review comment back to GitHub PR ----
async function postReviewComment(owner, repo, pull_number, review) {
  console.log('💬 Posting review comment to GitHub...');
  await octokit.pulls.createReview({
    owner,
    repo,
    pull_number,
    body: `## 🤖 GitGuard AI — Automated Code Review\n\n${review}\n\n---\n*Reviewed by GitGuard AI powered by Groq Llama 3*`,
    event: 'COMMENT'
  });
  console.log('✅ Review posted successfully!');
}

// ---- DASHBOARD ROUTE ----
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// ---- API ROUTE: get review history for dashboard ----
app.get('/reviews', (req, res) => {
  res.json(reviewHistory);
});

// ---- MAIN WEBHOOK HANDLER ----
app.post('/webhook', async (req, res) => {

  // Security check
  if (!verifyGitHubSignature(req)) {
    console.log('❌ Invalid signature - rejected');
    return res.status(401).send('Unauthorized');
  }

  const event = req.headers['x-github-event'];
  const { action, pull_request, repository } = req.body;

  // Only handle PR events
  if (event !== 'pull_request') {
    return res.status(200).send('Not a PR event, ignoring');
  }

  // Only when PR is opened or new code is pushed
  if (action === 'opened' || action === 'synchronize') {

    const startTime = Date.now();

    console.log('\n🔔 PR event received!');
    console.log('Action:', action);
    console.log('PR Title:', pull_request.title);
    console.log('Repo:', repository.full_name);
    console.log('PR Number:', pull_request.number);

    // Save to history immediately
    const historyEntry = {
      prNumber: pull_request.number,
      title: pull_request.title,
      repo: repository.full_name,
      time: new Date().toLocaleString(),
      action: action,
      bugs: 0,
      responseTime: '...',
      review: ''
    };
    reviewHistory.unshift(historyEntry);

    // Respond to GitHub immediately (must be within 10 seconds)
    res.status(200).send('OK');

    // Now do the AI work in the background
    try {
      const [owner, repo] = repository.full_name.split('/');

      // Step 1: Get the code diff
      const diff = await getPRDiff(owner, repo, pull_request.number);

      if (!diff || diff.length === 0) {
        console.log('⚠️ Empty diff, skipping review');
        await octokit.pulls.createReview({
          owner,
          repo,
          pull_number: pull_request.number,
          body: '## 🤖 GitGuard AI\n\n⚠️ No code changes detected in this PR. Nothing to review!',
          event: 'COMMENT'
        });
        return;
      }

      console.log('✅ Diff fetched, length:', diff.length, 'characters');

      // Step 2: Analyze with Groq AI
      const review = await analyzeWithGroq(diff);
      const bugCount = countBugs(review);

      console.log('✅ AI review generated!');
      console.log(`🐛 Bugs found: ${bugCount}`);

      // Step 3: Post review to GitHub
      await postReviewComment(owner, repo, pull_request.number, review);

      // Step 4: Calculate total time
      const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`⏱️ Total time: ${totalTime} seconds`);
      console.log(`📊 REVIEW_DATA: ${JSON.stringify({
        prNumber: pull_request.number,
        title: pull_request.title,
        repo: repository.full_name,
        bugs: bugCount,
        responseTime: totalTime + 's',
        time: new Date().toLocaleString()
      })}`);

      // Update history entry with results
      historyEntry.bugs = bugCount;
      historyEntry.responseTime = totalTime + 's';
      historyEntry.review = review;

      console.log('\n🎉 Full pipeline complete! Check your GitHub PR for the review.');

    } catch (error) {
      console.error('❌ Error in pipeline:', error.message);
    }

  } else {
    res.status(200).send('OK');
  }
});

app.listen(PORT, () => {
  console.log(`🚀 GitGuard AI listening on port ${PORT}`);
  console.log(`📡 Webhook endpoint: http://localhost:${PORT}/webhook`);
  console.log(`🖥️  Dashboard: http://localhost:${PORT}`);
});