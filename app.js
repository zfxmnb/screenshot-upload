var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var config = require('config');
var setTime = require('settime');

var mongo=require("mongodb");
var host="localhost";
var server=new mongo.Server(host,27017,{auto_reconnect:true});//创建数据库所在的服务器服务器
var db=new mongo.Db("test",server,{safe:true});

var index = require('./routes/index');
var login = require('./routes/login');
var sign = require('./routes/sign');
var test = require('./routes/test');
var msg = require('./routes/msg');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/index', index);
app.use('/login', login);
app.use('/sign', sign);
app.use('/test', test);
app.use('/msg', msg);
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});
// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});



var debug = require('debug')('appdemo:server');
var http = require('http');

/**
 * Get port from environment and store in Express.
 */

var port = normalizePort(process.env.PORT || '8080');
app.set('port', port);

/**
 * Create HTTP server.
 */
setTime.clearLoginRecord(config.ctime,config.expires);

var server = http.createServer(app);


/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);



//在线用户
var onlineUsers = {};
//当前在线人数
var onlineCount = 0;


var io = require('socket.io')(server);
io.on('connection',function(socket){
	//console.log("new msg");

	socket.on('chat message', function (from,to,data) {
      var json=[];
      json.push(onlineUsers[from]);
      json.push(from);
      json.push(data);
	    io.emit('chat message',json);
      if(data.indexOf("/**/")==-1&&data.indexOf("/##/")==-1){
      db.open(function (err,db) {
            db.collection("messages",function(err,collection){
              if(err) throw err;
                else{
                    collection.findOne({rel:"commonality"},function (err,docs){
                      if(err) throw err;
                      else{
                        if(docs){
                          collection.updateOne({rel:docs.rel},{$set:{massage:docs.massage+"/**/"+new Date().getTime()+"/##/"+from+"&chat"+"/##/"+data}},function(){
                            db.close();
                          });
                        }else{
                          collection.insert({rel:"commonality",massage:new Date().getTime()+"/##/"+from+"&chat"+"/##/"+data},function(){
                            db.close();
                          });
                        }
                      }
                    })
                  }
                })
              });
        }
	});
  socket.on('private message', function (from,to,data) {
    var json=[];
    json.push(onlineUsers[from]);
    json.push(from);
    json.push(data);
  	io.emit('to'+to,json);

    if(data.indexOf("/**/")==-1&&data.indexOf("/##/")==-1){
    db.open(function (err,db) {
          db.collection("messages",function(err,collection){
            if(err) throw err;
              else{
                  collection.findOne({$or:[{rel:from+"&"+to},{rel:to+"&"+from}]},function (err,docs){
                    if(err) throw err;
                    else{
                      if(docs){
                        collection.updateOne({rel:docs.rel},{$set:{massage:docs.massage+"/**/"+new Date().getTime()+"/##/"+from+"&"+to+"/##/"+data}},function(){
                          db.close();
                        });
                      }else{
                        collection.insert({rel:from+"&"+to,massage:new Date().getTime()+"/##/"+from+"&"+to+"/##/"+data},function(){
                          db.close();
                        });
                      }
                    }
                  })
                }
            	})
            });
      }
  });

    //监听新用户加入
    socket.on('login', function(obj){
        //将新加入用户的唯一标识当作socket的名称，后面退出的时候会用到
        socket.name = obj.userid;
        //检查在线列表，如果不在里面就加入
        if(!onlineUsers.hasOwnProperty(obj.userid)) {
            onlineUsers[obj.userid] = obj.username;
            //在线人数+1
            onlineCount++;
        }
        //向所有客户端广播用户加入
        io.emit('login', {onlineUsers:onlineUsers, onlineCount:onlineCount, user:obj.username});
        //console.log(obj.username+'加入了聊天室');
    });
    //监听用户退出
    socket.on('disconnect', function(){
        //将退出的用户从在线列表中删除
        if(onlineUsers.hasOwnProperty(socket.name)) {
            //退出用户的信息
            var obj = {userid:socket.name, username:onlineUsers[socket.name]};
            //删除
            delete onlineUsers[socket.name];
            //在线人数-1
            onlineCount--;
            //向所有客户端广播用户退出
            io.emit('logout', {onlineUsers:onlineUsers, onlineCount:onlineCount, user:obj});
        }
    });
});
/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}

module.exports = app;
