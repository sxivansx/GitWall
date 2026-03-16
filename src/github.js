const https = require("https");

const GITHUB_GRAPHQL = "https://api.github.com/graphql";

const CONTRIBUTION_QUERY = `
query($username: String!) {
  user(login: $username) {
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays {
            contributionCount
            date
            color
          }
        }
      }
    }
  }
}`;

function fetchContributions(username) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return Promise.reject(new Error("GITHUB_TOKEN not set"));
  }

  const body = JSON.stringify({
    query: CONTRIBUTION_QUERY,
    variables: { username },
  });

  return new Promise((resolve, reject) => {
    const url = new URL(GITHUB_GRAPHQL);
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: "POST",
      headers: {
        Authorization: `bearer ${token}`,
        "Content-Type": "application/json",
        "User-Agent": "GitWall/1.0",
        "Content-Length": Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          if (json.errors) {
            reject(new Error(json.errors[0].message));
            return;
          }
          if (!json.data || !json.data.user) {
            reject(new Error(`User "${username}" not found`));
            return;
          }
          const calendar =
            json.data.user.contributionsCollection.contributionCalendar;
          resolve(calendar);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

module.exports = { fetchContributions };
