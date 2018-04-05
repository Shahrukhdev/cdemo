/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

/* global __dirname */

var express = require('express');
var app = express();
var path = require('path');
var server = require('http').createServer(app);
var mysql = require('mysql');
var MySQLCM   =  require('mysql-connection-manager');
var socketio = require('socket.io')(server);
var fs =  require('fs');
var multer =  require('multer');
var async = require("async");

// Routing
app.use(express.static(path.join(__dirname, 'public')));
app.use('/public/uploads/', express.static(path.join(__dirname, '/public/uploads/')));

var limits = { fileSize: 10 * 1024 * 1024 }
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/uploads/');
    },
    filename: function (req, file, cb) {
      cb(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
    }
});

var upload = multer({ limits: limits, storage: storage }).single("file");

// POST method route
     app.post('/fileupload', function(req, res, next){

        upload(req, res, function (err, data) {
            if (err) {
				res.json({'status':0,'data': {'msg':'Something went wrong!', fileUrl:"notupload"}});
            } 
            var file_name = "https://chat.yoursmartguard.com/public/uploads/"+req.file.filename;
            res.json({'status':1,'data': {'msg':'File uploaded successfully', 'fileUrl':file_name}});
        });
  	});

var port = process.env.PORT || 3000;

server.listen(port, function () {
  console.log('Server listening at port %d', port);
});



var options = {
    host: 'localhost',// Host name for database connection.
    port: 3306,// Port number for database connection.
    
    //breath database details
   // user: 'breatheo_socket',// Database user.
    //password: '1RuaB^V]P(Mx',// Password for the above database user.
    //database: 'breatheo_socketchat',// Database name.
    
    
    //hireswift database details
    user: 'up_smart',// Database user.
    password: 'khT9m0!4',// Password for the above database user.
    database: 'admin_smart_updated',// Database name.
    
    autoReconnect: true,// Whether or not to re-establish a database connection after a disconnect.
    reconnectDelay: [
        500,// Time between each attempt in the first group of reconnection attempts; milliseconds.
        1000,// Time between each attempt in the second group of reconnection attempts; milliseconds.
        5000,// Time between each attempt in the third group of reconnection attempts; milliseconds.
        30000,// Time between each attempt in the fourth group of reconnection attempts; milliseconds.
        300000// Time between each attempt in the fifth group of reconnection attempts; milliseconds.
    ],
    useConnectionPooling: false,// Whether or not to use connection pooling.
    reconnectDelayGroupSize: 5,// Number of reconnection attempts per reconnect delay value.
    maxReconnectAttempts: 25,// Maximum number of reconnection attempts. Set to 0 for unlimited.
    keepAlive: true,// Whether or not to send keep-alive pings on the database connection(s).
    keepAliveInterval: 30000// How frequently keep-alive pings will be sent; milliseconds.
};

var manager = new MySQLCM(options);

manager.on('connect', function(connection) {
    console.log('Connection to database successful.');
});

manager.on('disconnect', function() {
    //console.log('Database connection lost.');
});

manager.on('reconnect', function(connection) {
    //console.log('Connection to database successful.')
});

var con = mysql.createConnection(options);

var manager = new MySQLCM(options, con);

var onlineUsers     =   [];
var socketByUser    =   [];
var userBySocket    =   [];
var userInfo        =   [];
var userGroups      =   [];
var onlinecount = 0;

con.connect(function(err){
  if(err){
    console.log('Error connecting to Db'+err);
    return;
  }
  console.log('Database connection established');
});



socketio.on('connection', function (socket) {
    console.log("user connected..", socket.id);
    socket.on('init', function (data, callback) {
        //onlinecount++;
        //console.log("user disconnect online : "+ onlinecount);
        console.log(data);
        socketByUser[data.id]   =   socket;
        userBySocket[socket.id]     =   data;
        callback(data);
    });
    
    socket.on('sendMessage', function(data, callback){
       callback({messages:data}); 
        console.log("listening sendMessage....");
        console.log(socket.id + " user message : "+ data.message);
        console.log("reiever="+data.receiverId);
            var MemberSocket = socketByUser[data.receiverId];
           var receiverId=data.receiverId.split(",");
        
         console.log(receiverId);

        //var MemberSocket2 = socketByUser[data.senderId];
        //console.log(MemberSocket + " sender  " + data.senderId);
        var date = new Date().getTime();
        data['datetime'] = date;
          for(var i=0; i<receiverId.length; i++)
          {
                receivers=receiverId[i];
              //  var MemberSocket = socketByUser[receivers];
                // MemberSocket.emit('receiveMessage', {messages:data});
                
                console.log(receivers);
               var sql = "INSERT INTO messages (senderId, receiverId, message,type, datetime) VALUES (?, ?, ?,?,?)";
          
       con.query(sql, [data.senderId, receivers, data.message, data.type, date], function(err, db_data){          
          if(err) throw err;
			    socket.broadcast.emit('receiveMessage', {messages:data});
        });
      }
         console.log(MemberSocket + " receiver  ");
         console.log("callback begin");
       
    });
    
    // disconnect user from socket
    socket.on('disconnect', function () {
     // onlinecount--; 
      var data    =   userBySocket[socket.id];
      console.log(data);
      
    //   delete userBySocket[socket.id];
    //   delete socketByUser[user];
      // socketByUser.splice(index, 1);
      
      console.log("user disconnect ");
      
  });
    
    socket.on('getHistory', function(data, callback){
      //  var userId = 356;
		var userId = data.senderId;
		var receiver_id = data.receiverId;
        var query = con.query("select * from messages where (senderId = ? AND receiverId = ?) OR (senderId = ? AND receiverId = ?)", [userId, receiver_id,receiver_id,userId], function(err, data){
           if(err) throw err;
		   
		   console.log(query.sql);
            console.log(data);
           callback({messages:data}); 
        });
    });
    
    
});


