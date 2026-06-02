
const Anthropic = require('@anthropic-ai/sdk');
const { Client } = require('@notionhq/client');
const TelegramBot = require('node-telegram-bot-api');
const cron = require('node-cron');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const notion = new Client({ auth: process.env.NOTION_API_KEY });
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

async function getNotionNotes() {
  const blocks = await notion.blocks.children.list({
    block_id: process.env.NOTION_PAGE_ID,
  });
  const text = blocks.results
    .filter(block => block.type === 'paragraph')
    .map(block => block.paragraph.rich_text.map(t => t.plain_text).join(''))
    .filter(t => t.length > 0)
    .join('\n');
  return text;
}

async function generateQuiz(notes) {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `You are a study assistant for a Product Management student. Read these notes and generate ONE quiz question. Return ONLY a raw JSON object with no markdown, no backticks, just pure JSON with two fields: "question" (include A-D options) and "answer" (include correct letter, one sentence explanation, 2-3 sentence rationale, and source section name). Notes: ${notes}`
    }]
  });
  return JSON.parse(message.content[0].text);
}

async function runQuizAgent() {
  console.log('Running quiz agent...');
  const notes = await getNotionNotes();
  if (!notes) {
    console.log('No notes found.');
    return;
  }

  const quiz = await generateQuiz(notes);

  await bot.sendMessage(process.env.TELEGRAM_CHAT_ID, `🧠 Product Management Quiz\n\n${quiz.question}\n\nReply with your answer!`);
  console.log('Question sent — waiting for your reply...');

  javascriptrequire('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk');
const { Client } = require('@notionhq/client');
const TelegramBot = require('node-telegram-bot-api');
const cron = require('node-cron');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const notion = new Client({ auth: process.env.NOTION_API_KEY });
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

let waitingForAnswer = false;
let currentQuiz = null;

async function getNotionNotes() {
  const blocks = await notion.blocks.children.list({
    block_id: process.env.NOTION_PAGE_ID,
  });
  return blocks.results
    .filter(b => b.type === 'paragraph')
    .map(b => b.paragraph.rich_text.map(t => t.plain_text).join(''))
    .filter(t => t.length > 0)
    .join('\n');
}

async function generateQuiz(notes) {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `You are a study assistant for a Product Management student. Read these notes and generate ONE quiz question. Return ONLY a raw JSON object with no markdown, no backticks, just pure JSON with two fields: "question" (include A-D options) and "answer" (include correct letter, one sentence explanation, 2-3 sentence rationale, and source section name). Notes: ${notes}`
    }]
  });
  return JSON.parse(message.content[0].text);
}

async function runQuizAgent() {
  console.log('Running quiz...');
  const notes = await getNotionNotes();
  if (!notes) { console.log('No notes found.'); return; }

  currentQuiz = await generateQuiz(notes);
  waitingForAnswer = true;

  await bot.sendMessage(process.env.TELEGRAM_CHAT_ID,
    `🧠 PM Quiz\n\n${currentQuiz.question}\n\nReply with A, B, C or D!`
  );
}

bot.on('message', async (msg) => {
  if (!waitingForAnswer || !currentQuiz) return;
  const userAnswer = msg.text.trim().toUpperCase().charAt(0);
  const correctAnswer = currentQuiz.answer.toUpperCase().match(/ANSWER:\s*([A-D])/)?.[1];
  waitingForAnswer = false;
  currentQuiz = null;

  if (userAnswer === correctAnswer) {
    await bot.sendMessage(process.env.TELEGRAM_CHAT_ID, `✅ Correct! 🎉\n\n📖 ${currentQuiz?.answer}`);
  } else {
    await bot.sendMessage(process.env.TELEGRAM_CHAT_ID, `❌ Not quite! 💪\n\n📖 ${currentQuiz?.answer}`);
  }
});

cron.schedule('30 8 * * 3', () => { runQuizAgent(); }); // 09:30 London time

console.log('Agent running...');
}

cron.schedule('30 9 * * 3', () => {
  runQuizAgent();
});

console.log('Agent started. Running test now...');
runQuizAgent();