require("dotenv").config();
const djs = require("discord.js");
const fs = require("fs");
let db = {};

const client = new djs.Client({
  intents: [
    djs.GatewayIntentBits.DirectMessages,
  ],
  partials: [
    djs.Partials.Channel
  ],
});
var guild = null;

async function getUser(input) {
  if (/^\d{17,20}$/.test(input)) {
    return await client.users.fetch(input);
  } else {
    const user = client.users.cache.find(u => u.username.toLowerCase() === input.toLowerCase());
    return user || null;
  }
}

async function init() {
  process.on('uncaughtException', e => console.error(e));
  process.on('unhandledRejection', e => console.error(e));
  process.on('exit', save);
  process.on('SIGINT', () => {
    client.destroy();
    console.log('');
    process.exit(0)
  });
  client.login(process.env.TOKEN);
  client.on('ready', () => {
    console.log('Ready!');

    client.application.commands.set([
      new djs.SlashCommandBuilder()
        .setName('start')
        .setDescription('Start a new chat.')
        .toJSON()
    ]);
  });
  client.on('messageCreate', x => {
    if (x.channel.type == 1 && !x.author.bot) {
      x.author.send('goober');
      console.log(x.author.tag);
    }
  });
  client.on('interactionCreate', x => {
    if (!x.isCommand()) return;
    if (x.commandName == 'start') {
      x.user.send('test');
      x.reply({
        content: 'Started new session!',
        ephemeral: true
      });
    }
  });
  setInterval(save, 3e5);
  load();
}

function save() {
  try {
    db = JSON.parse(fs.readFileSync(db.json));
  } catch (e) {
    db = {};
  }
}

function load() {
  try {
    db = JSON.parse(fs.readFileSync(db.json));
  } catch (e) {
    db = {};
  }
}

init();