var express = require('express');
var router = express.Router();
var app=express();

var sign = require('singleLogin');
var config = require('config');

var mongo=require("mongodb");
var host="localhost";
var server=new mongo.Server(host,27017,{auto_reconnect:true});//创建数据库所在的服务器服务器
var db=new mongo.Db("node",server,{safe:true});//创建数据库对象

/* GET home page. */
router.get('/', function(req, res, next) {
db.open(function (err,db) {
    db.collection("singlelogin",function(err,collection){
    	if(err) throw err;
        else{
			var userAgent=req.headers["user-agent"];
			var ipAddress=(req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress);
			var Cookies={};
        	if(req.headers.cookie){
	        	req.headers.cookie.split(';').forEach(function( Cookie ) {
			        var parts = Cookie.split('=');
			        if(parts[ 0 ].trim()=="username")
			        	Cookies[ parts[ 0 ].trim() ] = ( parts[ 1 ] || '' ).trim();
			        if(parts[ 0 ].trim()=="clientId")
			        	Cookies[ parts[ 0 ].trim() ] = parts[ 1 ] || '';
			        if(parts[ 0 ].trim()=="tempId")
			        	Cookies[ parts[ 0 ].trim() ] = (parts[ 1 ] || '' ).trim();
			    });
        	}
			//console.log(Cookies);
			if(Cookies.clientId&&Cookies.clientId!=null&&Cookies.username&&Cookies.username!=null&&Cookies.tempId&&Cookies.tempId!=null){
		   		collection.findOne({username:Cookies.username,clientId:Cookies.clientId,tempId:Cookies.tempId,ipAddress:ipAddress,userAgent:userAgent},function (err,docs){
		   			if(err) throw err;
					else{
						var time=new Date().getTime();
						if(req.query.target)
							var Referer=req.query.target;
						else
							var Referer="/chat";

						var domain=req.headers["host"].split(":")[0];
						var cookieDomain=domain;

						if(docs&&(time-parseInt(docs.time))<(config.expires*60000)){
							res.redirect(Referer);
			   				collection.updateOne(
							  {
							  	username:docs.username,
							  	password:docs.password
							  },
							  {
							  	$set:{
							  		time:time
							  	}
							  },
							  function(err,docs){
							  	db.close();
							});
						}else{
							res.render("login");
							db.close();
						}
					}
				});
			}else{
				res.render("login");
				db.close();
			}
		};
	});
});
});
router.post('/', function(req, res, next) {
	db.open(function (err,db) {
	    db.collection("singlelogin",function(err,collection){
	    	if(err) throw err;
	        else{
	        	var userAgent=req.headers["user-agent"];
				var ipAddress=(req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress);
				var Cookies={};
	        	if(req.headers.cookie){
		        	req.headers.cookie.split(';').forEach(function( Cookie ) {
				        var parts = Cookie.split('=');
				        if(parts[ 0 ].trim()=="username")
				        	Cookies[ parts[ 0 ].trim() ] = ( parts[ 1 ] || '' ).trim();
				        if(parts[ 0 ].trim()=="clientId")
				        	Cookies[ parts[ 0 ].trim() ] = parts[ 1 ] || '';
				        if(parts[ 0 ].trim()=="tempId")
				        	Cookies[ parts[ 0 ].trim() ] = (parts[ 1 ] || '' ).trim();
				    });
	        	}
	        	if(req.body.type=="logout"){
		   			res.end(JSON.stringify({success:true,msg:"logout"}));
					collection.remove(
							{$or:[{username:Cookies.username,ipAddress:ipAddress,userAgent:userAgent},{clientId:Cookies.clientId},{tempId:Cookies.tempId}]},function(err){
								if(err) throw err;
								else
								db.close();
							}
						);
				}else{
					res.end(JSON.stringify({success:false}));
					db.close();
				}
	        }
        });
	});
})
module.exports = router;
