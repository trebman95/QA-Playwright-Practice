// EDIT THIS FILE TO COMPLETE ASSIGNMENT QUESTION 1
const { arch } = require("os");
const { chromium } = require("playwright");

async function ageToTimeStamps(ageText) {
  // Enhanced regex to handle more cases like "1 minute" or "2 hours"
  const regex = /(\d+)\s*(minute|hour|day|week|month|year)s?/i;
  const match = regex.exec(ageText);

  // If no match is found, handle cases like "just now" or return Infinity for unmatched text
  if (!match) {
    const lowerText = ageText.toLowerCase();
    if (lowerText.includes('just now') || lowerText.includes('a moment ago')) {
      return new Date().getTime(); // Current time for "just now"
    }
    console.warn(`Unrecognized age format: ${ageText}`);
    return Infinity
  }; // Default to far future if no match

  const value = parseInt(match[1], 10); // Convert the captured numeric string to an integer
  const unit = match[2].toLowerCase(); // Convert the time unit to lowercase for uniformity

  const now = new Date(); //Get the current date and time
  const msPerUnit = {
    minute: 60 * 1000,
    hour: 60 * 60 * 1000,
    day: 24 * 60 * 60 * 1000,
    week: 7 * 24 * 60 * 60 * 1000
  };

  if (unit in msPerUnit) {
    return now.getTime() - value * msPerUnit[unit];
  }

  // Handle months and years separately due to variable lengths
  const date = new Date(now);
  switch (unit) {
    case 'month':
      date.setMonth(date.getMonth() - value);
      return date.getTime();
    case 'year':
      date.setFullYear(date.getFullYear() - value);
      return date.getTime();
    default:
      console.warn(`Unhandled time unit: ${unit}`);
      return Infinity;
  }
}

async function sortHackerNewsArticles() {
  // launch browser and go to Hacker News "Newest" page
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://news.ycombinator.com/newest");

  // Wait for the articles to be fully loaded
  await page.waitForSelector('.athing');

  //extract articles & timestamps (adjust selectors as needed)
  const articles = await page.$$eval('.athing', items => {
    return items.map(item => {
      const titleElement = item.querySelector('.titleline a');
      const ageElement = item.querySelector('.age a');

      return {
        title: titleElement?.textContent || 'Title not found',
        ageText: ageElement?.textContent || 'Age not found'
      };
    });
  });

  //Output the articles
  console.log(articles);


  //Validate if there are 100 articles
  const expectedCount = 100
  if (articles.length !== 100) {
    throw new Error(`[WebServer] Expected ${expectedCount} articles, but found ${articles.length}`);
  }
  console.log(`Found ${articles.length} articles`)


  //Create an array of articles with timestamps
  const articlesWithTimeStamps = await Promise.all(articles.map(async article => {
    return { title: article.title, timestamp: await ageToTimeStamps(article.ageText) }; //// Convert age text to timestamp
  }))

  //Check if the articles are sorted from newest to oldest
  const isSorted = articlesWithTimeStamps.every((article, i, arr) => {
    if (i === 0) return true; //Skip first article
    const currentTimeStamp = arr[i - 1].timestamp;
    const nextTimeStamp = article.timestamp;
    return currentTimeStamp >= nextTimeStamp; //Ensure that the current is older or equal
  });

  if (isSorted) {
    console.log('Articles are sorted from newest to oldest');
  } else {
    console.log('Articles are not sorted correctly');
  }

  await browser.close();
}

//Invoke the async function
(async () => {
  await sortHackerNewsArticles();
})();

module.exports = { sortHackerNewsArticles, ageToTimeStamps };
