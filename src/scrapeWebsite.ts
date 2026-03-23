const axios =  require('axios');
const cheerio = require('cheerio')

async function scrapeWebsite(url: string) {
    try {
        const { data: html } = await axios.get(url);
        const $ = cheerio.load(html);
        const gia = $('.headerindex2');
        const banRa = $('.headerindex3');
     
        return {giamuavao: $(gia[1]).text().trim(), giabanra: $(banRa[1]).text().trim()}
    } catch (error) {
        console.error(`Scraping error: ${error}`);
        return {giamuavao: 0, giabanra: 0}
    }
}

 export { scrapeWebsite }
//module.exports = { scrapeWebsite };