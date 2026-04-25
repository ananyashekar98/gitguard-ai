require('dotenv').config();
const express = require('express');
const crypto = require('crypto');
const { Octokit } = require('@octokit/rest');
const Groq = require('groq-sdk');

const app = express();
const PORT = process.env.PORT || 3000;
const path = require('path');
const cors = require('cors');
app.use(cors());

// Initialize Groq AI
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Initialize GitHub client
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
// In-memory store for reviews
const reviewHistory = [];

app.use(express.json({
  verify: (req, res, buf) => { req.rawBody = buf; }
}));

// Verify GitHub webhook signature
function verifyGitHubSignature(req) {
  const sig = req.headers['x-hub-signature-256'];
  if (!sig) return false;
  const hmac = crypto.createHmac('sha256', process.env.WEBHOOK_SECRET);
  const digest = 'sha256=' + hmac.update(req.rawBody).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(digest));
}

// Fetch the PR diff from GitHub
async function getPRDiff(owner, repo, pull_number) {
  console.log('Fetching PR diff...');
  const response = await octokit.pulls.get({
    owner,
    repo,
    pull_number,
    mediaType: { format: 'diff' }
  });
  return response.data;
}

// Send diff to Groq and get review
async function analyzeWithGemini(diff) {
  console.log('🤖 Sending code to Groq AI for review...');
  
  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'user',
        content: `You are an expert code reviewer. Analyze this GitHub Pull Request diff and provide a structured review.

Your review MUST include these sections:

## 📋 Summary
What does this PR change? (2-3 sentences)

## 🐛 Bugs Found
List any bugs or logic errors. If none, write "No bugs found."

## 🔒 Security Issues  
List any security vulnerabilities. If none, write "No security issues found."

## 💡 Code Quality Suggestions
List improvements for readability, performance, or best practices.

## ✅ Fixed Code
For each bug found, show the corrected code in a code block.

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
// Count bugs from AI review response
function countBugs(reviewText) {
  const bugsSection = reviewText.match(/## 🐛 Bugs Found([\s\S]*?)## /);
  if (!bugsSection) return 0;
  const content = bugsSection[1];
  if (content.toLowerCase().includes('no bugs found')) return 0;
  const matches = content.match(/^\d+\./gm);
  return matches ? matches.length : 0;
}
// Post review comment back to GitHub PR
async function postReviewComment(owner, repo, pull_number, review) {
  console.log('Posting review comment to GitHub...');
  await octokit.pulls.createReview({
    owner,
    repo,
    pull_number,
    body: `## 🤖 GitGuard AI Review\n\n${review}`,
    event: 'COMMENT'
  });
  console.log('✅ Review posted successfully!');
}

// Dashboard route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// Main webhook handler
app.post('/webhook', async (req, res) => {
  if (!verifyGitHubSignature(req)) {
    return res.status(401).send('Unauthorized');
  }

  const event = req.headers['x-github-event'];
  const { action, pull_request, repository } = req.body;

  if (event !== 'pull_request') {
    return res.status(200).send('Not a PR event, ignoring');
  }

  if (action === 'opened' || action === 'synchronize') {
    const startTime = Date.now();
    console.log('\n🔔 PR event received!');
    console.log('Action:', action);
    console.log('PR Title:', pull_request.title);
    console.log('Repo:', repository.full_name);
    console.log('PR Number:', pull_request.number);
    // Save to history so dashboard can read it
    reviewHistory.push({
      prNumber: pull_request.number,
      title: pull_request.title,
      repo: repository.full_name,
      time: new Date().toLocaleString(),
      action: action
    });

    res.status(200).send('OK');

    try {
      const [owner, repo] = repository.full_name.split('/');
      
      const diff = await getPRDiff(owner, repo, pull_request.number);
      
      const review = await analyzeWithGemini(diff);
const bugCount = countBugs(review);
console.log('✅ AI review generated!');
console.log(`🐛 Bugs found: ${bugCount}`);s
      
      await postReviewComment(owner, repo, pull_request.number, review);

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
      // Update the history entry with AI results
const entry = reviewHistory.find(r => r.prNumber === pull_request.number);
if (entry) {
  entry.responseTime = totalTime + 's';
  entry.review = review;
  entry.bugs = (review.match(/##\s*🐛/g) ? 
    (review.split('##')[review.split('##').findIndex(s => s.includes('🐛')) + 1] || '')
    .split('\n').filter(l => l.match(/^\d+\./)).length : 0);
}
      
    } catch (error) {
      console.error('❌ Error:', error.message);
    }

  } else {
    res.status(200).send('OK');
  }
});



app.get('/reviews', (req, res) => {
  res.json(reviewHistory);
});
app.listen(PORT, () => {
  console.log(`🚀 GitGuard AI listening on port ${PORT}`);
});