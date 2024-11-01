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

// Display "Hello World" on the home page with a link to the visitor log
app.get("/", (req, res) => {
  res.send(`
      <html>
        <head><title>Seth Weidman's Website</title></head>
        <link rel="stylesheet" type="text/css" href="/styles.css">        
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <body>
          <h1>Welcome to Seth Weidman's Website</h1>

          <img src="https://sethhweidman-personal-website.s3.amazonaws.com/profile-picture.jpg" alt="Seth Weidman" style="width:100%; max-width:600px;height:auto;">

          <br><br>
          <a href="https://www.linkedin.com/in/sethhweidman/" target="_blank">LinkedIn</a> | 
          <a href="https://github.com/SethHWeidman" target="_blank">GitHub</a> (and <a href="https://github.com/SethHWeidman/personal-website/tree/master" target="_blank">code for this website</a>)

          <br><br>
          Since December 2019, I've worked at <a href="https://www.sentilink.com" target="_blank">SentiLink</a>, growing from a Data Scientist (where around half my job was machine learning engineering) to now a Principal Product Manager reporting to a co-founder and the Head of Product Maxwell Blumenfeld, building multiple products from 0 to 1 along the way. 
          
          <br><br>
          In September 2019, O'Reilly published an introductory book I wrote covering the mechanics of Deep Learning models: <a href="https://www.amazon.com/Deep-Learning-Scratch-Building-Principles/dp/1492041416" target="_blank">Deep Learning From Scratch</a>.

          <br><br>
          Prior to SentiLink, <a href="https://www.youtube.com/watch?v=cVecfn8f3BU" target="_blank">spoke at Data Science conferences</a> regularly. Going even further back, I graduated from the University of Chicago with a double major in Mathematics and Economics in 2012, and am originally from Pittsburgh, PA.          

          <br><br>
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
          <link rel="stylesheet" type="text/css" href="/styles.css">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <body>
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
      res.send(`
        <html>
          <head><title>Visitor Log</title></head>
          <link rel="stylesheet" type="text/css" href="/styles.css">
          <meta name="viewport" content="width=device-width, initial-scale=1">          
          <body>
            <h1>Sorry, someone else has already signed the log today</h1>
            <a href="/visitor-log">Go back to the log</a>
          </body>
        </html>
      `);
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
