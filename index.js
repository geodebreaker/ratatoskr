// Ratatoskr by geodebreaker (MIT)

require("dotenv").config();
const djs = require("discord.js");
const fs = require("fs");
const { Z_ASCII } = require("zlib");
let db = {};

const client = new djs.Client({
  intents: [
    djs.GatewayIntentBits.DirectMessages
  ],
  partials: [
    djs.Partials.Channel,
    djs.Partials.User
  ],
});

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

    client.user.setPresence({
      status: 'online',
      activities: [
        {
          name: 'you sleep',
          type: 3, 
          // 0 = PLAYING, 1 = STREAMING, 2 = LISTENING, 3 = WATCHING
        },
      ],
    });

    client.application.commands.set([
      new djs.SlashCommandBuilder()
        .setName('start')
        .setDescription('Start a new chat.')
        .toJSON(),
      new djs.SlashCommandBuilder()
        .setName('stop')
        .setDescription('Stop chatting.')
        .toJSON(),
      new djs.SlashCommandBuilder()
        .setName('deanon')
        .setDescription('Deanonamize to find who you are chatting to.')
        .toJSON()
    ]);
  });
  client.on('messageCreate', x => {
    if (x.channel.type == 1 && !x.author.bot) {
      if (db[x.author.id]?.chat) {
        console.log(x.author.id, 'sent a message to', db[x.author.id].chat);
        client.users.fetch(db[x.author.id].chat).then(y =>
          y.send(x.content.split('\n').map(x => '> ' + x).join('\n')))
      } else {
        x.author.send('Use /start to connect to someone!')
      }
    }
  });
  client.on('interactionCreate', x => {
    if (!x.isCommand()) return;

    if (x.commandName == 'deanon') {
      if (!db[x.user.id].chat) {
        x.reply({
          content: 'Not connected.',
          ephemeral: true
        });
      } else {
        if (db[db[x.user.id].chat].deanon == x.user.id) {
          db[x.user.id].deanon = db[x.user.id].chat;
          x.reply({
            content: 'Deanonamizing...',
            ephemeral: true
          });
          client.users.fetch(db[x.user.id].chat).then(y => {
            y.send('You are talking to ' + x.user.username);
            x.user.send('You are talking to ' + y.username);
          });
          console.log(x.user.id, 'deanonamized with', db[x.user.id].chat);
        } else {
          db[x.user.id].deanon = db[x.user.id].chat;
          client.users.fetch(db[x.user.id].chat).then(y =>
            y.send('User requested deanonamization. ' +
              'Type /deanon if you want to find who you are talking to!'));
          x.reply({
            content: 'Requested deanonamization.',
            ephemeral: true
          });
          console.log(x.user.id, 'requested to deanonamize with', db[x.user.id].chat);
        }
      }
    }

    if (x.commandName == 'stop') {
      console.log(x.user.id, 'disconnected from', db[x.user.id].chat);
      if (db[x.user.id].chat) {
        db[db[x.user.id].chat].chat = null;
        client.users.fetch(db[x.user.id].chat).then(y =>
          y.send('User disconnected, new user being found...'));
        newConnect(db[x.user.id].chat, true);
        db[x.user.id].chat = null;
      }

      x.reply({
        content: 'Disconnected from user.',
        ephemeral: true
      });
    }

    if (x.commandName == 'start') {
      newConnect(x.user.id)

      if (db[x.user.id].chat) {
        if (!(x.channel && x.channel.type == 1))
          x.user.send('Started a new chat!');

        x.reply({
          content: 'Started a new chat!',
          ephemeral: true
        });
      } else {
        x.reply({
          content: 'No users to connect to! ):',
          ephemeral: true
        });
      }
    }
  });
  setInterval(save, 3e5);
  load();
}

function newConnect(x, y) {
  if (!db[x])
    db[x] = { chat: null, deanon: null };

  let oldchat = null;
  let users = Object.entries(db).filter(y =>
    y[0] != x &&
    y[1].chat == null &&
    y[0] != db[x].chat)
    .map(x => x[0]);
  oldchat = db[x].chat;
  db[x].chat = users[Math.floor(Math.random() * users.length)] ?? null;
  if (db[x].chat) db[db[x].chat].chat = x;
  if (y && !db[x].chat) client.users.fetch(x).then(y => y.send('Cannot find new user. ):'));
  if (db[x].chat) client.users.fetch(db[x].chat).then(x => x.send('New user connected. Say hi!'));
  console.log(x, 'connected to', db[x].chat);
  if (oldchat && !y) {
    db[oldchat].chat = null;
    client.users.fetch(oldchat).then(y => y.send('User disconnected, ' +
      (db[x].chat == null ? 'no more users can be found. ):' : 'new user being found...')));
    if (db[x].chat)
      newConnect(oldchat, true);
  }
}

function save() {
  fs.writeFileSync('db.json', JSON.stringify(db));
}

function load() {
  try {
    db = JSON.parse(fs.readFileSync('db.json'));
  } catch (e) { }
}

init();