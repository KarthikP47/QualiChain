const pool = require('./db');
const path = require('path');
const { PythonShell } = require('python-shell');

async function computeQualityScore(body, upvotes, downvotes) {
    return new Promise((resolve, reject) => {
        const pyShell = new PythonShell("score.py", {
            mode: "text",
            pythonOptions: ["-u"],
            scriptPath: path.join(__dirname, "ml"),
        });

        const currentReqId = "recalc_" + Date.now() + "_" + Math.random();
        
        pyShell.on("message", (message) => {
            try {
                const result = JSON.parse(message.trim());
                if (result.req_id === currentReqId) {
                    resolve(result.ML_PROB);
                    pyShell.kill();
                }
            } catch (e) {}
        });

        pyShell.send(JSON.stringify({
            req_id: currentReqId,
            body,
            upvotes,
            downvotes
        }));
    });
}

async function recalculate() {
    console.log("Fetching all posts...");
    const [posts] = await pool.query("SELECT id, body, upvotes, downvotes FROM posts");
    
    console.log(`Updating ${posts.length} posts...`);
    for (const post of posts) {
        const newScore = await computeQualityScore(post.body || "", post.upvotes || 0, post.downvotes || 0);
        console.log(`Post ID ${post.id}: New Score ${newScore}`);
        await pool.query("UPDATE posts SET quality_score = ? WHERE id = ?", [newScore, post.id]);
    }
    
    console.log("Recalculation complete!");
    process.exit();
}

recalculate().catch(console.error);
