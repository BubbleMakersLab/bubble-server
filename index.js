var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res){
    res.send("Bubble-server")
});

var chatHistory = []

io.on('connection', function(socket){
    console.log(JSON.stringify(chatHistory))

    console.log('a user connected');

    socket.on('chat history', function(){
        socket.emit('chat history', chatHistory)
    });

    socket.on('disconnect', function(){
        console.log('user disconnected');
    });


    socket.on('chat message', (msg) => {
        chatHistory.push(msg)
        console.log('message: ' + msg);
        io.emit('chat message',msg);
    });
});

http.listen(process.env.PORT || 8000, function(){
    console.log('listening on '+ (process.env.PORT || 8000));
});
