const axios = require("axios");
const fs = require("fs");
const path = require("path");

const LEETCODE_USERNAME = "shindearyan179";
const FILE_PATH = path.join(__dirname, "leetcode_data.csv");

const fetchLeetCodeData = async () => {
  const query = {
    query: `
      query {
        matchedUser(username: "${LEETCODE_USERNAME}") {
          profile {
            ranking
            contestCount
          }
          submitStats {
            acSubmissionNum {
              difficulty
              count
            }
          }
        }
      }
    `,
  };

  try {
    const { data } = await axios.post("https://leetcode.com/graphql", query, {
      headers: {
        "Content-Type": "application/json",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    const user = data.data.matchedUser;
    if (!user) throw new Error("User data not found");

    const { profile, submitStats } = user;
    const solvedStats = parseSolvedStats(submitStats.acSubmissionNum);

    return {
      date: new Date().toISOString().split("T")[0],
      rank: profile.ranking,
      totalSolved: solvedStats.total,
      easySolved: solvedStats.easy,
      mediumSolved: solvedStats.medium,
      hardSolved: solvedStats.hard,
      contestCount: profile.contestCount,
    };
  } catch (error) {
    console.error("Error fetching LeetCode data:", error.message);
    return null;
  }
};

const parseSolvedStats = (submissions) => {
  const solved = submissions.reduce(
    (acc, item) => {
      acc.total += item.count;
      acc[item.difficulty.toLowerCase()] = item.count;
      return acc;
    },
    { total: 0, easy: 0, medium: 0, hard: 0 }
  );
  return solved;
};

const saveData = (data) => {
  if (!data) return;

  const csvData = `${data.date},${data.rank},${data.totalSolved},${data.easySolved},${data.mediumSolved},${data.hardSolved},${data.contestCount}\n`;

  if (!fs.existsSync(FILE_PATH)) {
    const headers =
      "Date,Rank,Total Solved,Easy Solved,Medium Solved,Hard Solved,Contests\n";
    fs.writeFileSync(FILE_PATH, headers);
  }

  fs.appendFileSync(FILE_PATH, csvData, "utf8");
  console.log("Data saved successfully!");
};

const main = async () => {
  const leetCodeData = await fetchLeetCodeData();
  saveData(leetCodeData);
};

// Execute the script
main();
