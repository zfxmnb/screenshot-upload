var express = require('express');
var router = express.Router();
var app=express();
var sign = require('singleLogin');
var config = require('config');
var uuid = require('uuid');
var mongo=require("mongodb");
var host="localhost";
var server=new mongo.Server(host,27017,{auto_reconnect:true});//创建数据库所在的服务器服务器
var db=new mongo.Db("node",server,{safe:true});
/* GET home page. */

router.post('/', function(req, res, next) {
	db.open(function (err,db) {
	    db.collection("user",function(err,collection){
	    	if(err) throw err;
	        else{
		 		var data=req.body;
		 		collection.findOne({username:data.username},function (err,docs){
		 			if(err) throw err;
		 			else{
		 				if(data.type=="signin"){
			 				if(!docs){
			 					var user=new RegExp("^[a-z]*$");
			 					if(user.test(data.username)&&data.username.length>3&&data.username.length<12&&data.password.length>5&&data.password.length<15){
			 						res.end(JSON.stringify({success:true,msg:"register success"}));
			 						collection.insert({username:data.username,password:data.password},function(err){
			 							if(err) throw err;
										else
			 							db.close();
			 						});
			 					}else{
			 						res.end(JSON.stringify({success:false,msg:"register failed"}));
			 						db.close();
			 					}
			 				}else{
			 					res.end(JSON.stringify({success:false,msg:"registered"}));
			 					db.close();
			 				}
			 			}else if(data.type=="login"){
			 				if(docs&&data.password==docs.password){
			 					var name=docs.name||docs.username;
			 					db.collection("singlelogin",function(err,collection){
							    	if(err) throw err;
							        else{
								   		var time=new Date().getTime()
								   		var domain=req.headers["host"].split(":")[0];
								   		var cookieDomain=domain;

										var userAgent=req.headers["user-agent"];
								   		var ipAddress=(req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress);
								   		var time=new Date().getTime();
								   		collection.findOne({username:data.username,password:data.password,ipAddress:ipAddress,userAgent:userAgent},function (err,docs){
								   			if(err) throw err;
											else{
													//获取cookies
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

										   			if(!docs){
										   			//没有在登录表中找到对应记录
										   				//生成clientId
										   				if(Cookies.clientId&&Cookies.clientId!=""){
										   					var clientId=Cookies.clientId;
										   				}else{
										   					var clientId=uuid.v1();
										   				}
										   				//生成tempId
										   				var tempId=uuid.v4();

												   		//设置cookie
										   				res.setHeader('Set-Cookie', ['username='+data.username+';path=/;domain='+cookieDomain+';max-age=86400',
										   					'tempId='+tempId+';path=/;domain='+cookieDomain,
										   					'clientId='+clientId+';path=/;domain='+cookieDomain+';max-age=86400']);
										   				//返回信息
										   				res.end(JSON.stringify({success:true,msg:"allow"}));
										   				collection.remove({username:data.username,password:data.password}
										   					,function(err){
										   					if(err) throw err;
															 else
															 	//插入新数据到登录表
												   				collection.insert({
												   					username:data.username,
												   					name:name,
												   					password:data.password,
												   					ipAddress:ipAddress,
												   					tempId:tempId,
												   					time:time,
												   					clientId:clientId,
												   					userAgent:userAgent
												   				},
												   				function(err,docs){
												   					if(err) throw err;
																	else
												   					db.close();
												   				});
										   				});
										   			}else{
									   					if((parseInt(time)-parseInt(docs.time))>(config.expires*60000)){
									   					//登录已经过期
									   						//生成tempId
									   						if(Cookies.tempId){
										   						var tempId=Cookies.tempId;
											   				}else{
											   					var tempId=uuid.v4();
											   				}
									   						//更新新cookie
											   				res.setHeader('Set-Cookie', ['username='+docs.username+';path=/;domain='+cookieDomain+';max-age=86400',
												   					'tempId='+tempId+';path=/;domain='+cookieDomain,
												   					'clientId='+docs.clientId+';path=/;domain='+cookieDomain+';max-age=86400']);
											   				//返回信息
											   				res.end(JSON.stringify({success:true,msg:"allow"}));
											   				//移除过期表数据
									   						collection.remove({username:docs.username,password:docs.password}
									   							,function(err){
									   								//插入新数据到登录表
													   				collection.insert({
													   					username:data.username,
													   					name:name,
													   					password:data.password,
													   					ipAddress:ipAddress,
													   					tempId:tempId,
													   					time:time,
													   					clientId:docs.clientId,
													   					userAgent:userAgent
													   				},
													   				function(err,docs){
													   					if(err) throw err;
																	  	else
													   					db.close();
													   				});
									   							});
									   					}else{
									   					//已经登陆成功
									   						//更新新cookie
											   				res.setHeader('Set-Cookie', ['username='+docs.username+';path=/;domain='+cookieDomain+';max-age=86400',
												   					'tempId='+docs.tempId+';path=/;domain='+cookieDomain,
												   					'clientId='+docs.clientId+';path=/;domain='+cookieDomain+';max-age=86400']);
											   				//返回信息
											   				res.end(JSON.stringify({success:true,msg:"logged"}));
											   				//更新最新登陆时间
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
															  	if(err) throw err;
															  	else
															  	db.close();
															});
														}

										   			}
									   			}
								   		});
								   			
							        }
							    });
							}else{
								//密码或者用户名错误
								res.end(JSON.stringify({success:false,msg:"password Or username error"}));
		 						db.close();
							}
		 				}else{
		 					//已经注册
		 					res.end(JSON.stringify({success:false,msg:"option error"}));
		 					db.close();
		 				}
		 			}
				});
			}
		});
	});
});
module.exports = router;
