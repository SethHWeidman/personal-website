const express = require("express");
const { Pool } = require("pg");
const {
  createProxyMiddleware,
  fixRequestBody,
} = require("http-proxy-middleware");
const app = express();
const fs = require("fs");
const path = require("path");
function loadView(relPath) {
  return fs.readFileSync(path.join(__dirname, "views", relPath), "utf8");
}
app.set("trust proxy", 1); // Heroku router / secure cookies

const PORT = process.env.PORT || 3000;
require("dotenv").config(); // for testing only

const GPTREE_TARGET = process.env.GPTREE_URL; // e.g. 'https://gptree-app-a54ef3c1e1a2.herokuapp.com'
if (!GPTREE_TARGET) {
  throw new Error("Missing env var GPTREE_URL");
}

// Normalize /gptree (no slash) -> /gptree/ (with slash), preserve query
app.use((req, res, next) => {
  if (req.path === "/gptree") {
    const qIndex = req.originalUrl.indexOf("?");
    const qs = qIndex !== -1 ? req.originalUrl.slice(qIndex) : "";
    return res.redirect(308, "/gptree/" + qs); // 308 keeps method/body
  }
  next();
});

const gptreeProxy = createProxyMiddleware({
  target: GPTREE_TARGET,
  changeOrigin: true,
  ws: true,
  xfwd: true,
  logLevel: process.env.NODE_ENV === "production" ? "warn" : "debug",
  pathRewrite: { "^/gptree": "" },
  cookieDomainRewrite: { "*": "" },
  cookiePathRewrite: "/gptree",
  onProxyReq: fixRequestBody,
  onProxyRes: (proxyRes) => {
    const loc = proxyRes.headers["location"];
    if (!loc) return;

    // Don't double-prefix if already under /gptree
    if (/^\/gptree(\/|$)/.test(loc)) return;

    try {
      const t = new URL(GPTREE_TARGET);
      if (loc.startsWith(t.origin)) {
        proxyRes.headers["location"] = "/gptree" + loc.slice(t.origin.length);
      } else if (loc.startsWith("/")) {
        proxyRes.headers["location"] = "/gptree" + loc;
      }
    } catch {
      /* noop */
    }
  },
});

// 2) proxy
app.use("/gptree", gptreeProxy);

const isProduction = process.env.NODE_ENV === "production";

// Use the connection string from Heroku
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
});

// Middleware to parse form data
app.use(express.urlencoded({ extended: true }));

// Redirect all HTTP traffic to HTTPS in production only
if (isProduction) {
  app.use((req, res, next) => {
    if (req.header("x-forwarded-proto") !== "https") {
      return res.redirect(`https://${req.header("host")}${req.url}`);
    }
    next();
  });
}

app.use(express.static("public"));

// Helper function to render HTML layout with reusable CSS and meta tag
function renderHTML(title, bodyContent) {
  return `
    <html>
      <head>
        <title>${title}</title>
        <link rel="stylesheet" type="text/css" href="/styles.css">
        <meta name="viewport" content="width=device-width, initial-scale=1">
      </head>
      <body>
        ${bodyContent}
      </body>
    </html>
  `;
}

// Display "Hello World" on the home page with a link to the visitor log
app.get("/", (req, res) => {
  res.send(
    renderHTML(
      "Seth Weidman's Website",
      `
        ${loadView("home.html")}
        `
    )
  );
});

// New route for the affirmations blog post
app.get("/blog/affirmations", (req, res) => {
  res.send(
    renderHTML(
      "Character Strengths Affirmations Practice",
      `
        ${loadView("blog/affirmations.html")}
        `
    )
  );
});

app.get("/blog/o1-tools", (req, res) => {
  res.send(
    renderHTML(
      "O1 Pro - An Initial Assessment",
      `
        ${loadView("blog/o1-tools.html")}
        `
    )
  );
});

// Fetch the visitor log and render the page
app.get("/visitor-log", async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query(
      "SELECT name, signed_at FROM visitor_log ORDER BY signed_at DESC"
    );
    const visitors = result.rows; // This contains the data from the visitor_log table
    client.release();

    // Render the page and pass the visitor data
    res.send(
      renderHTML(
        "Visitor Log",
        `
          <h1>Sign the Visitor Log</h1>
          <p><strong>Only one person can sign the visitor log per day.</strong></p>

          <form action="/sign-log" method="POST">
            <label for="name">Your Name:</label>
            <input type="text" id="name" name="name" required />
            <button type="submit">Submit</button>
          </form>

          <h2>Visitors:</h2>
          ${generateVisitorsTable(visitors)}

          <br>

          <button onclick="window.location.href='/'">Back</button>

          <p>The visitor log is a feature designed mostly to test that the database behind this website is working.</p>            
        `
      )
    );
  } catch (err) {
    console.error(err);
    res.send("Error fetching visitor log.");
  }
});

app.get("/odsc_east_2025_grpo_llama", (req, res) => {
  res.send(
    renderHTML(
      "",
      `
        ${loadView("odsc_east_2025_grpo_llama.html")}
        `
    )
  );
});

app.get("/odsc_east_2025_grpo_llama/experiment_results.csv", (_, res) =>
  res.redirect(
    302,
    "https://data-science-talks.s3.us-east-1.amazonaws.com/output/experiment_results_2.csv"
  )
);

// Function to generate the HTML table for visitors
function generateVisitorsTable(visitors) {
  if (visitors.length === 0) {
    return "<p>No visitors yet.</p>";
  }

  let table = `
    <table border="1" cellpadding="10">
      <tr>
        <th>Name</th>
        <th>Date Signed</th>
      </tr>
  `;

  visitors.forEach((visitor) => {
    const formattedDate = new Date(visitor.signed_at).toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );
    table += `
      <tr>
        <td>${visitor.name}</td>
        <td>${formattedDate}</td>
      </tr>
    `;
  });

  table += "</table>";
  return table;
}

// Handle form submission
app.post("/sign-log", async (req, res) => {
  const { name } = req.body;
  const today = new Date().toISOString().split("T")[0]; // Get only the date part

  try {
    const client = await pool.connect();

    // Check if someone has already signed today
    const result = await client.query(
      `SELECT COUNT(*) FROM visitor_log WHERE signed_at::date = $1`,
      [today]
    );
    const alreadySigned = result.rows[0].count > 0;

    if (alreadySigned) {
      // If someone has signed, show a message
      client.release();
      res.send(
        renderHTML(
          "Visitor Log",
          `
            <h1>Sorry, someone else has already signed the log today</h1>
            <a href="/visitor-log">Go back to the log</a>
          `
        )
      );
    } else {
      // If no one has signed today, insert the new entry
      const timestamp = new Date().toISOString();
      await client.query(
        "INSERT INTO visitor_log (name, signed_at) VALUES ($1, $2)",
        [name, timestamp]
      );
      client.release();

      res.redirect("/visitor-log");
    }
  } catch (err) {
    console.error(err);
    res.send("Error saving your entry. Please try again.");
  }
});

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${server.address().port}`);
});
