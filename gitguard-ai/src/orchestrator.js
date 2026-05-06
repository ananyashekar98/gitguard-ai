const { getDiff, postComment } = require('./githubService');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Review = require('./models/Reviews');

// 1. Sanitize the API Key (Crucial for Windows)
const apiKey = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : "";
const genAI = new GoogleGenerativeAI(apiKey);

async function handlePullRequest(payload) {
    const repo = payload.repository.full_name;
    const prNumber = payload.pull_request?.number || payload.number;

    try {
        console.log(`📡 Fetching diff for ${repo} PR #${prNumber}...`);
        const diffData = await getDiff(repo, prNumber);
        if (!diffData) return;

        // 2. Try the most stable model first, then fall back to newer versions
        let model;
        const modelOptions = ["gemini-1.5-flash","gemini-flash-latest","gemini-2.5-flash-lite","gemini-2.5-pro","gemini-2.0-flash"];
        // const modelOptions = ["gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-2.0-flash"];
        let responseText = "";

        console.log("🤖 Analysis in progress...");

        for (const modelName of modelOptions) {
            try {
                console.log(`Trying model: ${modelName}...`);
                model = genAI.getGenerativeModel({ model: modelName }, { apiVersion: 'v1' });
                
                const prompt = `Analyze this GitHub diff for security vulnerabilities and bugs. 
                If safe, reply with the exact string "CLEAN_STATUS". 
                
                DIFF DATA:
                ${diffData}`;

                const result = await model.generateContent(prompt);
                responseText = result.response.text();
                
                if (responseText) {
                    console.log(`✅ Success with model: ${modelName}`);
                    break; // Exit loop if we get a response
                }
            } catch (err) {
                if (err.message.includes("404")) {
                    console.warn(`⚠️ ${modelName} not found, trying next...`);
                    continue;
                }
                throw err; // Re-throw if it's a real error (like 429)
            }
        }

        if (!responseText) throw new Error("Could not reach any Gemini models.");

        const status = responseText.toUpperCase().includes("CLEAN_STATUS") ? "Clean" : "Critical";
        
        // 3. MongoDB Save
        await Review.create({
            repoName: repo,
            prNumber: prNumber,
            analysis: responseText,
            status: status
        });
        
        console.log(`✅ MongoDB Update: Review saved for PR #${prNumber}`);

        // 4. GitHub Commenting
        if (status !== "Clean") {
            console.log(`💬 Posting comment to PR #${prNumber}...`);
            await postComment(repo, prNumber, `🛡️ **GitGuard AI Analysis**\n\n${responseText}`);
        }

    } catch (error) {
        console.error(`❌ Orchestrator Failure:`, error.message);
    }
}

module.exports = { handlePullRequest };