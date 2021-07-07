const puppeteer = require('puppeteer');
const stream = require('stream');
const { promisify } = require('util');
const got = require('got');

const pipeline = promisify(stream.pipeline);
const fs = require('fs');
const path = require('path');
const hostname = 'www.groobygirls.com';
const hosts = ['www.groobygirls.com', 'www.tgirls.porn'];
const nats = '?nats=MTAxNTc0LjIuNjguMTk2LjEuMC4wLjAuMA';
async function downloadLink(url, p, filename) {
  try {
    console.log('Downloading:', url.pathname);
    const browser = await puppeteer.launch({ headless: true, ignoreHTTPSErrors: true });
    const page = await browser.newPage();
    if (typeof url !== 'undefined') {
      url.pathname = url.pathname.replace(/\/{2,}/g, '/');
      fs.mkdir(p, { recursive: true }, (err) => {
        if (err) throw err;
      });
      await pipeline(got.stream(url.href), fs.createWriteStream(path.join(p, filename)));
    }
  } catch (e) {
    console.log(e);
  }
}
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.tracing.start({
    path: 'trace.json',
    categories: ['devtools.timeline'],
  });
  async function getData(hostname) {
    let videos = JSON.parse(await fs.readFileSync(`data.json`));
    await page.goto(`https://${hostname}/tour/models/ally-sparkles.html${nats}`);

    // execute standard javascript in the context of the page.
    const videosOnPage = await page.$$eval(`.sexyvideo  a[href*="/tour/trailers/"], .sexyvideo h4 >a`, (anchors) => {
      const tmp = {};
      anchors.forEach((anchor) => {
        console.log(anchor);
        tmp[decodeURI(anchor.title.replace(/  |\r\n|\n|\r|\t/gm, '').trim())] = { href: anchor.href.trim() };
      });
      return tmp;
    });
    Object.entries(videos).forEach(([title, { href }]) => (videos[title].href = `${href}${nats}`));
    videos = { ...videosOnPage, ...videos };

    for (let v of Object.keys(videosOnPage)) {
      console.log('Processing:', v);
      await page.goto(videos[v].href);
      let video = await page.$eval('div.trailerdata > div.trailermp4', (el) => el.innerText.trim());
      const videoThumb = await page.$eval('.player-thumb img', (img) => img.src.trim());
      let description = null;
      try {
        description = await page.$eval(`div.trailerpage_meta > div.trailerpage_info > p:nth-child(3)`, (description) => description.innerText);
      } catch {
        try {
          description = await page.$eval(`div.trailerpage_meta > div > p`, (description) => description.innerText);
        } catch {
          console.log('Failed to get dscription');
        }
      }
      const url = new URL(page?.url()) || new URL(`http://${hostname}`);
      video = `${url.protocol}//${url.host}${video}`;
      const foldername = v.replace(/(\s|\:|\&)/gm, '-').replace(/-{2,}/, '-');
      await fs.mkdir(path.join(__dirname, foldername), { recursive: true }, (err) => {
        if (err) throw err;
      });
      const p = path.join(__dirname, foldername);
      downloadLink(new URL(video), p, 'trailer.mp4');
      downloadLink(new URL(videoThumb), p, 'thumb.jpg');
      videos[v].video = video;
      videos[v].slug = foldername;
      videos[v].thumb = videoThumb;
      videos[v].description = description;
      await fs.writeFileSync(`${p}/data.json`, JSON.stringify(videos[v], null, 2), { encoding: 'utf8', flag: 'w' });
    }
    await fs.writeFileSync(`data.json`, JSON.stringify(videos, null, 2), { encoding: 'utf8', flag: 'w' });
    console.log(videos);
  }
  for (let h of hosts) {
    console.log('Scraping from', h);
    await getData(h);
  }
  await page.tracing.stop();
  await browser.close();
})();
