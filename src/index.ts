import { Telegraf } from 'telegraf';
import { about } from './commands';
import { greeting } from './text';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { development, production } from './core';
require('dotenv').config();
const { google } = require('googleapis');
import { scrapeWebsite } from './scrapeWebsite';
import { appendToSheet, updateToSheet, getToSheet } from './utils/sheets';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const ENVIRONMENT = process.env.NODE_ENV || '';

const bot = new Telegraf(BOT_TOKEN);

let auth;
let goldPrices = {giamuavao: 0, giabanra: 0};

if (process.env.GOOGLE_CREDENTIALS_JSON) {
  // If credentials JSON is provided directly in the env (useful on platforms
  // where a file can't be stored), parse and pass to GoogleAuth.
  try {
    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
    auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
  } catch (err) {
    console.error('Failed to parse GOOGLE_CREDENTIALS_JSON:', err);
    throw err;
  }
} else {
  const keyFile = process.env.GOOGLE_CREDENTIALS_FILE || 'credentials.json';
  auth = new google.auth.GoogleAuth({
    keyFile, // path to service account file
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });
}
const sheets = google.sheets({ version: 'v4', auth });

bot.command('mua', async (ctx) => {
  const text = ctx.message.text;
  const parts = text.split(' ');
  if (parts.length < 3) {
    ctx.reply("❌ Vui lòng cung cấp giá mua. Ví dụ: /mua 58000000 2");
    return;
  }
  try {
    // Ví dụ: thời gian, giá mua,số lượng
    const values = [new Date().toLocaleString().split(',')[0], parseInt(parts[1]), parseInt(parts[2])];
    await appendToSheet(sheets, values, 'Mua!A:C');
    ctx.reply("✅ Tin nhắn của bạn đã được lưu vào Google Sheet!");
  } catch (err) {
    console.error(err);
    ctx.reply("❌ Có lỗi xảy ra khi lưu dữ liệu.");
  }
});


bot.command('giavang', async (ctx) => {
  const targetUrl = 'https://ngocthinh-jewelry.vn/'; // Example target URL
  const giaVang = await scrapeWebsite(targetUrl);
  if (giaVang.giamuavao) {
    goldPrices = giaVang;
    await updateToSheet(sheets, [giaVang.giamuavao], 'Mua!F2:F3');
    ctx.replyWithMarkdown(`Giá mua vào: ${giaVang.giamuavao}\nGiá bán ra: ${giaVang.giabanra}`);
  } else {
    ctx.reply("❌ Không thể lấy giá vàng từ trang web.");
  }
});

bot.command('soluong', async (ctx) => {
  const response = await getToSheet(sheets, 'Mua!E1:F3');
  ctx.reply(response.data.values.map((row: any) => row.join(': ')).join('\n') || 'No data found.');
});

// Message handler for any text message
bot.on('text', (ctx) => {
  const { text } = ctx.message
  if (text === '/giavang ') {
    ctx.reply(`Gia vang hom nay:`);
  } else {
    ctx.reply(`You said: ${ctx.message.text}`);
  }
});

bot.command('about', about());
bot.on('message', greeting());

export const getGoldPrice = async (req: VercelRequest, res: VercelResponse) => {
  const targetUrl = 'https://ngocthinh-jewelry.vn/'; // Example target URL
  const giaVang = await scrapeWebsite(targetUrl);
  if (giaVang.giamuavao !== goldPrices.giamuavao || giaVang.giabanra !== goldPrices.giabanra) {
    goldPrices = giaVang;
    await updateToSheet(sheets, [giaVang.giamuavao], 'Mua!F2:F3');
    res.status(200).json({ giamuavao: giaVang.giamuavao, giabanra: giaVang.giabanra });
  } else {
    res.status(500).json({ error: "Không thể lấy giá vàng từ trang web." });
  }
};

//prod mode (Vercel)
export const startVercel = async (req: VercelRequest, res: VercelResponse) => {
  await production(req, res, bot);
};
//dev mode
ENVIRONMENT !== 'production' && development(bot);
