// EDIT THIS FILE TO COMPLETE ASSIGNMENT QUESTION 1
const { arch } = require("os");
const { chromium } = require("playwright");

async function ageToTimeStamps(ageText) {
  const regex = /(\d+)\s*(minute|hour|day|week|month|year)s?/i; //Regular expression to match age text in the format of "<number> <unit>"
  const match = regex.exec(ageText); //Execute the regex against the provided ageText to extract the numeric value and time unit


  // If no match is found, handle cases like "just now" or return Infinity for unmatched text
  if (!match) { // Handle cases like "just now" or "a moment ago"
    if (ageText.toLowerCase().includes('just now') || ageText.toLowerCase().includes('a moment ago')) {
      return new Date().getTime(); // Current time for "just now"
    }
    return Infinity
  }; // Default to far future if no match

  const value = parseInt(match[1], 10); // Convert the captured numeric string to an integer
  const unit = match[2].toLowerCase(); // Convert the time unit to lowercase for uniformity

  const now = new Date(); //Get the current date and time
  switch (unit) { //Calculate the timestamp based on the unit and value
    case 'minute':
      return now.getTime() - value * 60 * 1000; // Convert to milliseconds
    case 'hour':
      return now.getTime() - value * 60 * 60 * 1000; // Convert to milliseconds
    case 'day':
      return now.getTime() - value * 24 * 60 * 60 * 1000; // Convert to milliseconds
    case 'week':
      return now.getTime() - value * 7 * 24 * 60 * 60 * 1000; // Convert to milliseconds
    case 'month':
      return new Date(now.setMonth(now.getMonth() - value)).getTime(); // Date object for months
    case 'year':
      return new Date(now.setFullYear(now.getFullYear() - value)).getTime(); // Date object for years
    default:
      return Infinity; // Return far future if unmatched
  }
}

async function sortHackerNewsArticles() {
  // launch browser
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // go to Hacker News "Newest" page
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
  if (articles === 100) {
    console.log("Found 100 articles");
  } else {
    console.error(`Expected 100 artcles, but found ${articles.length}`);
    //Delay for 3 seconds and close browser
    await page.waitForTimeout(3000)
    await browser.close();
    return;
  }

  //Create an array of articles with timestamps
  const articlesWithTimeStamps = await Promise.all(articles.map(async article => {
    return { title: article.tile, timestamp: await ageToTimeStamps(article.ageText) };
  }))

  //Check if the articles are sorted from newest to oldest
  const isSorted = articlesWithTimeStamps.every((article, i, arr) => {
    if (i === 0) return true; //Skip first article
    const currentTimeStamp = new Date(arr[i - 1].ageElement).getTime();
    const nextTimeStamp = new Date(article.ageElement).getTime();
    return currentTimeStamp >= nextTimeStamp; //Ensure that the current is older or equal
  });

  if (isSorted) {
    console.log('Articles are sorted from newest to oldest');
  } else {
    console.log('Articles are not sorted correctly');
  }
}


//Invoke the async function
(async () => {
  await sortHackerNewsArticles();
})();
