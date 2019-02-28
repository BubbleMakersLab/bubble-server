const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const bodyParser = require('body-parser');
const TelegramBot = require('node-telegram-bot-api');
const R = require('ramda')
const axios = require('axios');

require('dotenv').config()

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

// replace the value below with the Telegram token you receive from @BotFather
const token = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(token);
bot.setWebHook(process.env.TELEGRAM_WEBHOOK);

function updateMessage(msg, telegramId = null) {
    const formattedMessage = `[${msg.username}]: ${msg.message}`
    chatHistory.push(msg)

    // Chat
    io.emit('chat message', msg);

    // Telegram
    if (telegramId) {
        telegramChatIds = R.uniq([...telegramChatIds, telegramId])

        // Telegram
        R.without([telegramId], telegramChatIds).map(id => {
            bot.sendMessage(id, formattedMessage);
        })
    } else {
        telegramChatIds.map(id => {
            bot.sendMessage(id, formattedMessage);
        })
    }

    // Facebook
    axios.post(process.env.FACEBOOK_WEBHOOK, {
        message: formattedMessage
    })

}

app.get('/', function (req, res) {
    res.send("Bubble-server")
});

app.post('/webhook/telegram', function (req, res) {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

app.post('/webhook/facebook', function (req, res) {
    const body = req.body

    const msg = {
        username: body["first name"],
        application: "facebook",
        message: body["last user freeform input"]
    }

    updateMessage(msg)
    res.sendStatus(200);
});


var chatHistory = []
var telegramChatIds = []

io.on('connection', function (socket) {
    console.log('a user connected');

    socket.on('chat history', function () {
        socket.emit('chat history', chatHistory)
    });

    socket.on('disconnect', function () {
        console.log('user disconnected');
    });


    socket.on('chat message', (msg) => {
        updateMessage(msg)
    });
});

// Listen for any kind of message. There are different kinds of messages.
bot.on('message', (msg) => {
    const message = {
        username: msg.from.first_name,
        application: "telegram",
        message: msg.text
    }

    updateMessage(message, msg.chat.id)
});


http.listen(process.env.PORT || 8000, function () {
    console.log('listening on ' + (process.env.PORT || 8000));
});
