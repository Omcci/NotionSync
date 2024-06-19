import express from "express";
import cors from "cors";
import { NotionSync } from "./src/notionSync.js";
import { githubToken, orgName } from "./utils/config.js";

const app = express();
const port = process.env.PORT || 4001;
const notionSync = new NotionSync();

app.use(cors());
app.use(express.json());

let syncStatus = {
  lastSyncDate: null,
  errorBranch: null,
  statusMessage: null,
};

app.get("/api/repos", async (req, res) => {
  const { username } = req.query;
  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }

  try {
    const repos = await notionSync.fetchUserRepos(username);
    console.log("API is sending repos:", repos);

    res.status(200).json({ repos });
  } catch (error) {
    console.error("Error fetching repositories:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/branches", async (req, res) => {
  const { repoName } = req.query;
  if (!repoName) {
    return res.status(400).json({ error: "Repository name is required" });
  }

  try {
    const branches = await notionSync.fetchRepoBranches(
      githubToken,
      orgName,
      repoName
    );
    console.log("API is sending branches:", branches);

    res.status(200).json({ branches });
  } catch (error) {
    console.error("Error fetching branches:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/sync", async (req, res) => {
  try {
    const syncResult = await notionSync.sync();
    syncStatus = {
      lastSyncDate: new Date(),
      errorBranch: null,
      statusMessage: "Sync completed successfully",
    };
    res.status(200).json({ message: syncResult });
  } catch (error) {
    console.error("Error during sync:", error.message);
    const branchName = error.branchName || "unknown";
    syncStatus = {
      lastSyncDate: new Date(),
      errorBranch: branchName,
      statusMessage: `Error syncing branch '${error.branchName}': ${error.message}`,
    };
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/syncStatus", (req, res) => {
  res.status(200).json(syncStatus);
  // console.log("API is sending sync status:", syncStatus);
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
