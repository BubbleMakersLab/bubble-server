const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const bodyParser = require('body-parser');
const TelegramBot = require('node-telegram-bot-api');
const R = require('ramda')
require('dotenv').config()

app.use(bodyParser.json());

// replace the value below with the Telegram token you receive from @BotFather
const token = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(token);
bot.setWebHook(process.env.TELEGRAM_WEBHOOK);

app.get('/', function(req, res){
    res.send("Bubble-server")
});

app.post('/webhook/telegram', function(req, res){
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

var chatHistory = []
var telegramChatIds = []

io.on('connection', function(socket){
    console.log('a user connected');

    socket.on('chat history', function(){
        socket.emit('chat history', chatHistory)
    });

    socket.on('disconnect', function(){
        console.log('user disconnected');
    });


    socket.on('chat message', (msg) => {
        chatHistory.push(msg)
        io.emit('chat message',msg);

        // Telegram
        telegramChatIds.map(id => {
            bot.sendMessage(id, `[${msg.username}]: ${msg.message}`);
        })

    });
});

// Listen for any kind of message. There are different kinds of messages.
bot.on('message', (msg) => {
    const message = {
        username: msg.from.first_name,
        application: "telegram",
        message: msg.text
    }

    chatHistory.push(message)
    telegramChatIds = R.uniq([...telegramChatIds, msg.chat.id])

    // Telegram
    R.without([msg.chat.id],telegramChatIds).map(id => {
        bot.sendMessage(id, `[${message.username}]: ${message.message}`);
    })

    io.emit('chat message',message);
});


http.listen(process.env.PORT || 8000, function(){
    console.log('listening on '+ (process.env.PORT || 8000));
});
