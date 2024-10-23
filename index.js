// EDIT THIS FILE TO COMPLETE ASSIGNMENT QUESTION 1
const { arch } = require("os");
const { chromium } = require("playwright");

async function ageToTimeStamps(ageText) {
  // Enhanced regex to handle more cases like "1 minute" or "2 hours"
  const regex = /(\d+)\s*(minute|hour|day|week|month|year)s?\s+ago|just now/i;
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
  const unit = match[2]?.toLowerCase(); // Convert the time unit to lowercase for uniformity

  const now = new Date(); //Get the current date and time
  const msPerUnit = {
    minute: 60 * 1000,
    hour: 60 * 60 * 1000,
    day: 24 * 60 * 60 * 1000,
    week: 7 * 24 * 60 * 60 * 1000
  };

  switch (unit) {
    case 'month':
      return new Date(now.setMonth(now.getMonth() - value)).getTime();
    case 'year':
      return new Date(now.setFullYear(now.getFullYear() - value)).getTime();
    case 'minute':
    case 'hour':
    case 'day':
    case 'week':
      return new Date(now.getTime() - value * msPerUnit[unit]).getTime();
    default:
      console.warn(`Unhandled time unit: ${unit}`);
      return null; // Use null for unmatched units
  }

}

async function sortHackerNewsArticles() {
  // Launch browser and go to Hacker News "Newest" page
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://news.ycombinator.com/newest");

  let articles = [];
  let morePages = true;

  while (morePages) {
    // Wait for the articles to be fully loaded
    try {
      await page.waitForSelector('.athing', { timeout: 60000 });
    } catch (error) {
      console.error('Error waiting for articles:', error);
      break; // Exit the function if we can't find articles
    }

    // Extract articles & timestamps (adjust selectors as needed)
    const newArticles = await page.$$eval('.athing', items => {
      return items.map(item => {
        const titleElement = item.querySelector('.titleline a');
        const ageElement = item.querySelector('.age a');

        // Debugging: Log the article structure if age is missing
        if (!ageElement) {
          console.warn('Missing age element, logging full article for inspection:');
          console.log(item.innerHTML); // Log the entire item to inspect structure
        }

        return {
          title: titleElement?.textContent.trim() || 'Title not found',
          ageText: ageElement?.textContent.trim() || 'Age not found'
        };
      });
    });


    newArticles.forEach(article => {
      if (article.ageText === 'Age not found') {
        console.warn(`Unrecognized age format for article: "${article.title}"`);
      }
    });

    articles = [...articles, ...newArticles]; // Add new articles to the main list

    // Check if there's a "more" button to navigate to the next page
    const nextPageLink = await page.$('a.morelink');
    if (nextPageLink) {
      // Click the "more" button to load more articles, retrying if needed
      try {
        await nextPageLink.click();
        await page.waitForLoadState('networkidle'); // Wait for network to be idle before proceeding
      } catch (error) {
        console.log('Error clicking the next page link, retrying...');
        await page.waitForSelector('a.morelink', { timeout: 5000 });
        await nextPageLink.click();
        await page.waitForLoadState('networkidle');
      }
    } else {
      morePages = false; // No more pages
    }
  }

  // Validate if there are 100 articles
  const expectedCount = 100;
  if (articles.length < expectedCount) {
    console.warn(`[WebServer] Expected ${expectedCount} articles, but found ${articles.length}`);
  }
  console.log(`Found ${articles.length} articles`);

  // Create an array of articles with timestamps
  const articlesWithTimeStamps = await Promise.all(articles.map(async article => {
    const timestamp = await ageToTimeStamps(article.ageText); // Convert age text to timestamp
    console.log(`Article: "${article.title}", Age Text: "${article.ageText}", Timestamp: ${timestamp}`);
    return { title: article.title, timestamp };
  }));

  console.log('Articles with timestamps:', articlesWithTimeStamps);

  // Check if the articles are sorted from newest to oldest
  const isSorted = articlesWithTimeStamps.every((article, i, arr) => {
    if (i === 0) return true; // Skip first article
    const currentTimeStamp = arr[i - 1].timestamp;
    const nextTimeStamp = article.timestamp;
    console.log(`Comparing timestamps: ${currentTimeStamp} >= ${nextTimeStamp}`);
    return currentTimeStamp >= nextTimeStamp; // Ensure that the current is older or equal
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
})().catch(console.error);

module.exports = { sortHackerNewsArticles, ageToTimeStamps };
