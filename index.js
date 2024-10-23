const express = require("express");
const { Pool } = require("pg");
const app = express();
const PORT = process.env.PORT || 3000;
require("dotenv").config(); // for testing only

const isProduction = process.env.NODE_ENV === "production";

// Use the connection string from Heroku
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
});

// Middleware to parse form data
app.use(express.urlencoded({ extended: true }));

// Display "Hello World" on the home page with a link to the visitor log
app.get("/", (req, res) => {
  res.send(`
      <html>
        <head><title>Seth Weidman's Website</title></head>
        <body>
          <h1>Welcome to Seth Weidman's Website</h1>
          <a href="/visitor-log">Sign the Visitor Log</a>
        </body>
      </html>
    `);
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
    res.send(`
        <html>
          <head><title>Visitor Log</title></head>
          <body>
            <h1>Sign the Visitor Log</h1>
            <form action="/sign-log" method="POST">
              <label for="name">Your Name:</label>
              <input type="text" id="name" name="name" required />
              <button type="submit">Submit</button>
            </form>
  
            <h2>Visitors:</h2>
            ${generateVisitorsTable(visitors)}
  
          </body>
        </html>
      `);
  } catch (err) {
    console.error(err);
    res.send("Error fetching visitor log.");
  }
});

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

// Handle form submissions and insert the visitor log entry into the database
app.post("/sign-log", async (req, res) => {
  const { name } = req.body;
  const timestamp = new Date().toISOString();

  try {
    const client = await pool.connect();
    await client.query(
      "INSERT INTO visitor_log (name, signed_at) VALUES ($1, $2)",
      [name, timestamp]
    );
    client.release();
    res.send(
      `<h1>Thanks, ${name}! You've signed the visitor log at ${timestamp}.</h1>`
    );
  } catch (err) {
    console.error(err);
    res.send("Error saving your entry. Please try again.");
  }
});

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${server.address().port}`);
});
