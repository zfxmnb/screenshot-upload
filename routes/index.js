var express = require('express');
var router = express.Router();
var app=express();
var mongo=require("mongodb");
var macObj = require('getmac');
var host="localhost";
var server=new mongo.Server(host,27017,{auto_reconnect:true});//创建数据库所在的服务器服务器
var db=new mongo.Db("test",server,{safe:true});//创建数据库对象
/* GET home page. */
router.get('/', function(req, res, next) {
	db.open(function (err,db) {
	    db.collection("singlelogin",function(err,collection){
	    	if(err) throw err;
	        else{
	        	var Cookies={};
	        	if(req.headers.cookie){
		        	req.headers.cookie.split(';').forEach(function( Cookie ) {
				        var parts = Cookie.split('=');
				        if(parts[ 0 ].trim()=="username")
				        	Cookies[ parts[ 0 ].trim() ] = ( parts[ 1 ] || '' ).trim();
				        if(parts[ 0 ].trim()=="clientId")
				        	Cookies[ parts[ 0 ].trim() ] = (parts[ 1 ]-0) || 0;
				    });
	        	}
	        	console.log(Cookies)
	        	collection.find(Cookies).toArray(function (err,docs){
	        		if(err) throw err;
	        		else{
	        			console.log(docs)
	        			var time=new Date().getTime();
	        			if(docs.length>0){
	        				if((parseInt(time)-parseInt(docs[0].time))<600*1000){
	        					res.setHeader('Set-Cookie', [ 'username='+docs[0].username+';path=/;max-age=600','clientId='+docs[0].clientId+';path=/;max-age=600']);
	        					res.render("index");
	        					collection.update(
									  {username:docs[0].username,password:docs[0].password},
									  {$set:{time:time}},
									  function(err,docs){
									  	db.close();
									  });
	        				}else{
	        					res.redirect("/login");
	        					db.close();
	        				}
	        			}else{
	        				macObj.getMac(function(err,mac){
								    if (err)  throw err;
								   	else{
								   		collection.find({macAddress:mac}).toArray(function (err,docs){
								   				if (err)  throw err;
								   				else{
								   					if(docs.length>0){
								   						res.setHeader('Set-Cookie', [ 'username='+docs[0].username+';path=/;max-age=600','clientId='+docs[0].clientId+';path=/;max-age=600']);
	        											res.render("index");
	        											collection.update(
															  {macAddress:docs[0].macAddress},
															  {$set:{time:time}},
															  function(err,docs){
															  	db.close();
															  });
								   					}else{
	        											res.redirect("/login");
	        											db.close();
								   					}
								   				}
								   		})
								   	}
							});
	        			}
	        		}
	        	});
	        	
	        }
	    });
	});
});

module.exports = router;
