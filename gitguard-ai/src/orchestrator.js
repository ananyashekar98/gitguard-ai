const { getDiff, postComment } = require('./githubService');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Review = require('./models/Reviews');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function handlePullRequest(payload) {
    const repo = payload.repository.full_name;
    const prNumber = payload.number;

    try {
        const diffData = await getDiff(repo, prNumber);
        if (!diffData) return;

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        // System Prompt Engineering for "Senior Security Engineer" Persona[cite: 1]
        const prompt = `
            Context: Senior Security Engineer review for GitGuard AI.
            Task: Analyze this GitHub Diff for bugs, security flaws (SQLi, XSS, Secrets), or performance leaks.
            
            Rules:
            1. Suggest actual, corrected code blocks in Markdown.
            2. If clean, reply with "CLEAN_STATUS".
            3. Prioritize high-severity vulnerabilities.
            
            DIFF:
            ${diffData}
        `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // Save to AI Memory (MongoDB)[cite: 1]
        const status = responseText.includes("CLEAN_STATUS") ? "Clean" : "Critical";
        
        await Review.create({
            repoName: repo,
            prNumber: prNumber,
            analysis: responseText,
            status: status
        });

        // Feedback Loop: Post back to GitHub[cite: 1]
        if (status !== "Clean") {
            await postComment(repo, prNumber, responseText);
        }
    } catch (error) {
        console.error("Analysis Failed:", error);
    }
}

module.exports = { handlePullRequest };