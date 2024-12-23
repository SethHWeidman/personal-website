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
        <h1>Welcome to Seth Weidman's Website</h1>

        <img src="https://sethhweidman-personal-website.s3.amazonaws.com/profile-picture.jpg" alt="Seth Weidman">

        <br><br>
        <a href="https://www.linkedin.com/in/sethhweidman/" target="_blank">LinkedIn</a> | 
        <a href="https://github.com/SethHWeidman" target="_blank">GitHub</a> (and <a href="https://github.com/SethHWeidman/personal-website/tree/master" target="_blank">code for this website</a>)

        <h2>Blog Posts</h2>
        <ul>
          <li><a href="/blog/affirmations">Character Strengths Affirmations Practice</a></li>
          <li><a href="/blog/o1-tools">O1 Pro - An Initial Assessment</a></li>
        </ul>

        <h2>Bio</h2>
        <p>
          Since December 2019, I've worked at <a href="https://www.sentilink.com" target="_blank">SentiLink</a>, growing from a Data Scientist (where around half my job was machine learning engineering) to now a Principal Product Manager reporting to a co-founder and the Head of Product Maxwell Blumenfeld, building multiple products from 0 to 1 along the way.
        </p>
        
        <p>
          In September 2019, O'Reilly published an introductory book I wrote covering the mechanics of Deep Learning models: <a href="https://www.amazon.com/Deep-Learning-Scratch-Building-Principles/dp/1492041416" target="_blank">Deep Learning From Scratch</a>.
        </p>

        <p>
          Prior to SentiLink, <a href="https://www.youtube.com/watch?v=cVecfn8f3BU" target="_blank">spoke at Data Science conferences</a> regularly. Going even further back, I graduated from the University of Chicago with a double major in Mathematics and Economics in 2012, and am originally from Pittsburgh, PA.
        </p>

        <br>
        <a href="/visitor-log">Sign the Visitor Log</a>
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
        <h1>Character Strengths Affirmations Practice</h1>

        <p class="post-date">November 24, 2024</p>

        <p>We spend much of our lives trying to solve problems in specific areas of our life: getting ahead professionally, improving one's relationships, and so on.</p>

        <p>While clearly important, one's "fundamentals" or "character" have a huge impact on success in these domains; "character is destiny", as the saying goes. This is one of the main reasons religious practice has enduring popularity: it constitutes dedicated time to focus on character improvement.</p>

        <p>What should we study during this time? We could study to be better Christians or Jews; while fine options, organized religion has too many negative associations for many.</p>

        <p>My search for a non-religious character improvement practice led me to a subfield of academic psychology known as "positive psychology", which studies how to help mentally healthy people live more fulfilling lives (the rest of psychology deals with helping less-mentally healthy individuals regain their mental health). This field has arrived at a list of 24 "character strengths", grouped into six categories, that lead to living a fulfilling life. Here are ChatGPT's descriptions of the six categories and 24 individual strenghts:</p>

        <div class="character-strengths">
          <h3>Group 1: Wisdom and Knowledge</h3>
          <p>This group includes strengths that involve acquiring and using knowledge effectively.</p>
          <ol>
            <li><strong>Creativity</strong> – Thinking of novel and productive ways to approach tasks and solve problems.</li>
            <li><strong>Curiosity</strong> – Seeking out new experiences, ideas, and learning with openness and interest.</li>
            <li><strong>Judgment</strong> – Thinking things through and examining situations from all angles with a balanced view.</li>
            <li><strong>Love of Learning</strong> – Embracing opportunities to acquire new knowledge or skills.</li>
            <li><strong>Perspective</strong> – Offering wise advice and seeing the bigger picture in situations.</li>
          </ol>

          <h3>Group 2: Courage</h3>
          <p>Courage encompasses strengths that allow individuals to overcome fear and adversity.</p>
          <ol start="6">
            <li><strong>Bravery</strong> – Acting on convictions and standing up for what's right, despite risks or challenges.</li>
            <li><strong>Perseverance</strong> – Finishing what is started with diligence and determination, even when difficult.</li>
            <li><strong>Honesty</strong> – Being truthful, authentic, and acting in line with one's values.</li>
            <li><strong>Zest</strong> – Approaching life with excitement and energy, enjoying each activity fully.</li>
          </ol>

          <h3>Group 3: Humanity</h3>
          <p>Humanity consists of strengths related to relationships and caring for others.</p>
          <ol start="10">
            <li><strong>Love</strong> – Valuing close relationships with others and showing warmth, empathy, and care.</li>
            <li><strong>Kindness</strong> – Helping and doing favors for others, motivated by genuine concern.</li>
            <li><strong>Social Intelligence</strong> – Being aware of the motives and feelings of oneself and others and responding appropriately.</li>
          </ol>

          <h3>Group 4: Justice</h3>
          <p>Justice involves strengths that contribute to healthy community and group dynamics.</p>
          <ol start="13">
            <li><strong>Teamwork</strong> – Excelling in collaborative roles and valuing group success over individual gain.</li>
            <li><strong>Fairness</strong> – Treating all people equally, without prejudice or favoritism.</li>
            <li><strong>Leadership</strong> – Encouraging a group to achieve goals while maintaining positive relationships.</li>
          </ol>

          <h3>Group 5: Temperance</h3>
          <p>Temperance is about exercising self-control and moderation to protect against excess.</p>
          <ol start="16">
            <li><strong>Forgiveness</strong> – Letting go of resentment and offering second chances to those who have wronged you.</li>
            <li><strong>Humility</strong> – Not seeking the spotlight and being aware of one's limitations.</li>
            <li><strong>Prudence</strong> – Making careful, thoughtful choices and avoiding unnecessary risks.</li>
            <li><strong>Self-Regulation</strong> – Exercising control over one's emotions, impulses, and behaviors.</li>
          </ol>

          <h3>Group 6: Transcendence</h3>
          <p>Transcendence encompasses strengths that connect individuals to the larger universe and provide meaning.</p>
          <ol start="20">
            <li><strong>Appreciation of Beauty and Excellence</strong> – Noticing and valuing beauty, skill, and excellence in various domains.</li>
            <li><strong>Gratitude</strong> – Being aware of and thankful for the good things that happen.</li>
            <li><strong>Hope</strong> – Expecting the best in the future and working to achieve it.</li>
            <li><strong>Humor</strong> – Seeing the lighter side of life, often in ways that bring smiles to others.</li>
            <li><strong>Spirituality</strong> – Having a sense of purpose and connection to something greater than oneself.</li>
          </ol>
        </div>

        <p>The claim is that each of these is "universally recognized": taking the last two of these I've studied, Fairness and Self-Regulation, this means that someone showing exceptionally fair and equal treatment of those around him, or someone showing exceptional control over one's impulses and emotions, would be lauded for these character strengths in most of the world's cultures.</p>

        <h2>My practice</h2>

        <ol>
          <li>Each day, I pick one of these mostly at random (I actually balance the strengths so that I'm equally likely to choose a strength from any of the six categories).</li>
          <li>I then use LLM-based tools to generate "affirmations" related to the character strength.</li>
          <li>I copy these down by hand, and then reflect on them for a few minutes.</li>
        </ol>

        <p>Today, for example, the character strength I'm reviewing is "Hope" (part of "Transcendence"); the five affirmations that I've written by hand to reinforce this character strength are:</p>

        <ol>
          <li>I am optimistic about what tomorrow brings and work diligently toward my goals.</li>
          <li>Every challenge is an opportunity for growth, and I embrace it with hope.</li>
          <li>I focus on solutions and remain hopeful in all circumstances.</li>
          <li>My positive attitude attracts positive results.</li>
          <li>Each day is a new chance to move closer to my dreams.</li>
        </ol>

        <h2>Conclusion and next steps</h2>

        <p>This practice has made me reflect deeply and holistically on what it means to be a good person and consistently pushes me to be better.</p>

        <p>If you're interested in participating in this practice, I'm happy to send you affirmations on a daily basis. I would like to grow an online community of individuals who participate; when a few of you join (as of this writing it's just me) I will create a Discord for us to keep in touch. I look forward to this practice enriching other people's lives as it has enriched my own.</p>

        <br>
        <button onclick="window.location.href='/'">Back to Home</button>
      `
    )
  );
});

app.get("/blog/o1-tools", (req, res) => {
  res.send(
    renderHTML(
      "O1 Pro - An Initial Assessment",
      `
        <h1>O1 Pro - An Initial Assessment</h1>
        <p class="post-date">December 22, 2024</p>

        <p><strong>TL;DR</strong>: these tools will not replace software engineers. There may even be an adjustment period where these tools make those who use them <i>less</i> productive. Over the long term, I agree that those who learn to use these tools will be much more productive than those who don’t, but I'd qualify say both “learn to use”, because it will take time to learn to use them well, and “tools”, because there are multiple of them. In fact, my personal next step is to experiment with using O1-mini, O1, and O1 Pro to see which tasks mini (which is much faster, usually “thinking” for only a couple seconds) tackles just as well as O1 Pro (which typically thinks for at least a minute). Picking "the right tool for the job" will be increasingly important for software engineers.</p>

        <p>I spent hours over the weekend trying to get O1 Pro to do something that should have taken a leading LLM tool half an hour at most. I wanted it to create a simple app illustrating the functionality of the OpenAI API, calling the API from a Python backend using the Flask framework and streaming the response to a React frontend. I decided to make it use these technologies since I’m familiar with them (especially Flask) (interestingly, it initially selected FastAPI for the frontend), and it made the task more realistic to what a developer might need to do in the real world: accomplish some task within the language and other frameworks that the rest of their team currently uses.</p>

        <p>Getting the basic thing working was as easy as you’d expect; the issue came when trying to get the React app to properly render the markdown returned from the API response. This stumped O1 Pro for a shockingly long time; it repeatedly kept rendering the markdown incorrectly, commonly displaying the markdown with absurdly large font (see screenshot - and please don’t judge my choice of test prompt).</p>

        <img 
          src="https://sethhweidman-personal-website.s3.amazonaws.com/absurd_font_chatgpt_app.jpg"
          alt="Screenshot of absurd font issue"
          width="600"
        >

        <p>Eventually, even after yelling at O1 Pro in all caps and telling it it was a terrible front end developer (which didn’t help), I had to prompt it to add print statements to its own code so I could help it figure out what was going on (it’s striking to me that it didn’t figure out to start doing this on its own). After looking at the logs on both the Python side and the React side, I discovered that new line characters <code>\\n</code> weren’t being parsed correctly by <a href="https://github.com/SethHWeidman/streaming-openai-react-demo/blob/master/frontend/src/App.js#L33-L36" target="_blank" rel="noopener noreferrer">these lines</a>in the code.</p>

        <p>This was leading to scenarios where, instead of the app rendering markdown like:

          <pre><code>
            # Heading text

            Start of paragraph
          </code></pre>

        it was rendering text like:

          <pre><code>
            # Heading textStart of paragraph
          </code></pre>

        which is why the font size issues I was seeing were occurring.</p>

        <p>After I helped O1 Pro discover this, it came up with the solution of wrapping the output of the Flask backend in a JSON blob and having the React front end unpack the JSON; this preserved the newline characters.</p>

        <p>Overall: despite O1 Pro currently being the leading LLM tool on the market, this is a solution you would expect a junior dev to come up with, and you would expect an intermediate-level dev to both identify the problem and come up with the solution. By the way, when I briefly tried to have Claude solve the same problem, it couldn't do so either.</p>

        <h2>Conclusion</h2>

        <p>While I'm sure O1 Pro is now the leading tool for software developers, it is certainly overhyped - I predict that it will not "replace" even beginner-level devs, and it will only enhance the workflows of devs who are already intermediate or above. That said, I can't wait to evolve my own workflow alongside the many versions of O1 that now exist and see how other technical folks do the same - it truly is a brave new world we are entering!</p> 

        <br>
        <button onclick="window.location.href='/'">Back to Home</button>
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
