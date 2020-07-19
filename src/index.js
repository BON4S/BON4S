require('dotenv').config();
const core = require('@actions/core');

const imageMagick = require('imagemagick');
const Twit = require('twit');

const { WakaTimeClient, RANGE } = require('wakatime-client');

const {
  WAKATIME_API_KEY: wakatimeApiKey,
  TWITTER_API_KEY: twitterApiKey,
  TWITTER_API_SECRET_KEY: twitterApiSecretKey,
  TWITTER_ACCESS_TOKEN: twitterAccessToken,
  TWITTER_ACCESS_TOKEN_SECRET: twitterAccessTokenSecret,
  WORKSPACE_PATH: workspace,
} = process.env;

const twitter = new Twit({
  consumer_key: twitterApiKey,
  consumer_secret: twitterApiSecretKey,
  access_token: twitterAccessToken,
  access_token_secret: twitterAccessTokenSecret,
});

const quotesData = require('../data/quotes-data.json');

const image01 = `${workspace}/assets/images/01.png`;
const image02 = `${workspace}/assets/images/02.png`;
const image03 = `${workspace}/assets/images/03.png`;
const readmeImage = `${workspace}/assets/images/readmeImage.png`;

const wakatime = new WakaTimeClient(wakatimeApiKey);

var date = new Date();
date = date.getFullYear() + '-' + date.getMonth() + '-' + date.getDate();

const backgroundColor = 'white';
const borderColor = 'white';
const foregroundColor = '#222';
const fontFamily = 'sans-serif';
const heightSize = '140';
const borderSize = '20x0';

function generateBarChart(percent, barSize) {
  let syms = '░████████';
  // let syms = "░▏▎▍▌▋▊▉█";

  let frac = Math.floor((barSize * 8 * percent) / 100);
  let barsFull = Math.floor(frac / 8);
  if (barsFull >= barSize) {
    return syms.substring(8, 9).repeat(barSize);
  }
  let semi = frac % 8;

  return [syms.substring(8, 9).repeat(barsFull), syms.substring(semi, semi + 1)]
    .join('')
    .padEnd(barSize, syms.substring(0, 1));
}

async function handleProgrammingLanguageMetricsData() {
  try {
    const stats = await wakatime.getMyStats({ range: RANGE.LAST_7_DAYS });

    let title = 'Most used languages  <small>(last 7 days)</small>';

    let lines = [];

    for (let i = 0; i < Math.min(stats.data.languages.length, 5); i++) {
      let data = stats.data.languages[i];
      let { name, percent, text: time } = data;

      let line = [
        ` <span><small>${generateBarChart(
          percent,
          12,
        )}  <small>${name}   <span fgcolor="#999">${
          String(percent.toFixed(1)) + '%'
        }   <small>${time}</small></span></small></small></span>\n`,
      ];

      lines.push(line);
    }

    if (lines.length == 0) {
      lines = '<small>No data for the last 7 days. :(</small>';
    }

    return `
    <span rise="-4000"><small>${title}</small></span>
 <span rise="-10000">${lines.join(' ')}</span>`;
  } catch (error) {
    core.error(error.message);
  }
}

async function createTwitterImage(twitterAccount, numberOfTweets) {
  let dateContent = `<span rise="-4000" fgcolor="#aaa"><small>${date}</small></span>`;
  let marks = `<span fgcolor="#005DC6"><b>•</b></span>`;
  let tweetContent = '';
  let formattedTweetsContent = '';
  let titleContent = 'Latest tweets';
  numberOfTweets === '1' && (titleContent = 'Last tweet');

  async function handleCreateTwitterImage() {
    try {
      imageMagick.convert(
        [
          '-size',
          `200x${heightSize}`,
          '-background',
          `${backgroundColor}`,
          '-fill',
          `${foregroundColor}`,
          '-font',
          `${fontFamily}`,
          '-define',
          'pango:justify=true',
          `pango:${formattedTweetsContent}`,
          `${image03}`,
        ],
        function (error) {
          error && core.error(`>>> Error! ${error}`);
        },
      );
    } catch (error) {
      core.error(error.message);
    }
  }

  try {
    twitter.get(
      'statuses/user_timeline',
      { screen_name: twitterAccount, count: numberOfTweets },
      async (err, data, response) => {
        if (!err) {
          data.forEach((tweet) => {
            tweetContent =
              tweetContent +
              `${marks} <span fgcolor="#444">${tweet.text}</span>\n`;
          });

          formattedTweetsContent = `
<span rise="-4000"><small>${titleContent}</small></span>\n
<span rise="6000"><small><small>${tweetContent}</small></small></span>
`;
          await handleCreateTwitterImage();
        } else {
          core.error(`>>> Error! ${err}`);
        }
      },
    );
  } catch (error) {
    core.error(error.message);
  }
}

async function createMostUsedLanguagesImage() {
  try {
    imageMagick.convert(
      [
        '-size',
        `360x${heightSize}`,
        '-background',
        `${backgroundColor}`,
        '-fill',
        `${foregroundColor}`,
        '-font',
        `${fontFamily}`,
        `pango:${await handleProgrammingLanguageMetricsData()}`,
        `${image01}`,
      ],
      function (error) {
        error && core.error(`>>> Error! ${error}`);
      },
    );
  } catch (error) {
    core.error(error.message);
  }
}

async function createQuoteImage() {
  try {
    let ramdomQuote =
      quotesData.quotes[Math.floor(Math.random() * quotesData.quotes.length)];
    let quoteAuthor = ramdomQuote[0];
    let quoteContent = ramdomQuote[1];

    let titleContent = 'Random Quote';
    let dateContent = `<span rise="-4000" fgcolor="#aaa"><small>${date}</small></span>`;
    let authorText = `<span fgcolor="#444">${quoteAuthor}</span>`;
    let marks = `<span fgcolor="#005DC6"><b>"</b></span>`;
    let quoteText = `${marks}<span fgcolor="#555">${quoteContent}</span>${marks}`;
    let formattedQuoteText = `
<span rise="-4000"><small>${titleContent}  <small>${dateContent}</small></small></span>\n
<span rise="8000"><small><small><i>${quoteText}</i>  ${authorText}</small></small></span>
`;

    imageMagick.convert(
      [
        '-size',
        `200x${heightSize}`,
        '-background',
        `${backgroundColor}`,
        '-fill',
        `${foregroundColor}`,
        '-font',
        `${fontFamily}`,
        '-define',
        'pango:justify=true',
        `pango:${formattedQuoteText}`,
        '-bordercolor',
        `${borderColor}`,
        '-border',
        `${borderSize}`,
        `${image02}`,
      ],
      function (error) {
        error && core.error(`>>> Error! ${error}`);
      },
    );
  } catch (error) {
    core.error(error.message);
  }
}

async function createReadmeImage() {
  try {
    imageMagick.convert(
      [`${image01}`, `${image02}`, `${image03}`, '+append', `${readmeImage}`],
      function (error) {
        error && core.error(`>>> Error! ${error}`);
      },
    );
  } catch (error) {
    core.error(error.message);
  }
}

(async () => {
  try {
    await createMostUsedLanguagesImage();
    await createQuoteImage();
    await createTwitterImage('BonasRodrigo', '1');
    setTimeout(async () => {
      await createReadmeImage();
    }, 7000);
  } catch (error) {
    core.error(error.message);
  }
})();
