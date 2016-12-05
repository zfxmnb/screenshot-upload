var express = require('express');
var router = express.Router();
var app=express();
var macObj = require('getmac');
var sign = require('singleLogin');
var macObj = require('getmac');
var uuid = require('uuid');
/* GET home page. */

router.post('/', function(req, res, next) {
 	sign.auth("sign",function(collection){
 		var db=this;
 		var data=req.body;
 		collection.findOne({username:data.username},function (err,docs){
 			if(err) throw err;
 			else{
 				//console.log(req.header[""])
 				if(data.type=="signin"){
	 				if(!docs){
	 					var user=new RegExp("^[a-z]*$");
	 					if(user.test(data.username)&&data.username.length>3&&data.username.length<12&&data.password.length>5&&data.password.length<15){
	 						collection.insert({username:data.username,password:data.password});
	 						res.end(JSON.stringify({success:true,msg:"register success"}));
	 					}else{
	 						res.end(JSON.stringify({success:false,msg:"register failed"}));
	 					}
	 					db.close();
	 				}else{
	 					res.end(JSON.stringify({success:false,msg:"registered"}));
	 					db.close();
	 				}
	 			}else if(data.type=="login"){
	 				if(docs&&data.password==docs.password){
	 					db.collection("singlelogin",function(err,collection){
					    	if(err) throw err;
					        else{
						   		var time=new Date().getTime()
						   		var domain=req.headers["host"].split(":")[0];
						   		//console.log(domain);
								var userAgent=req.headers["user-agent"];
								macObj.getMac(function(err,mac){
								    if (err)  throw err;
								   	else{
								   		var ipAddress=(req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress);
								   		var time=new Date().getTime();
								   		collection.findOne({username:data.username,password:data.password,ipAddress:ipAddress,macAddress:mac,userAgent:userAgent},function (err,docs){
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
										   				var tempId="#"+time+Math.random();
										   				//获取mac
										   				macObj.getMac(function(err,mac){
														    if (err)  throw err;
														   	else{
														   		//设置cookie
												   				res.setHeader('Set-Cookie', ['username='+data.username+';path=/;domain=.'+domain+';max-age=83400',
												   					'tempId='+tempId+';path=/;domain=.'+domain,
												   					'clientId='+clientId+';path=/;domain=.'+domain+';max-age=83400']);
												   				//返回信息
												   				res.end(JSON.stringify({success:true,msg:"allow"}));
												   				collection.remove({$or:[
												   					{username:data.username,password:data.password},
												   					{ipAddress:ipAddress,macAddress:mac,userAgent:userAgent}
												   				]});
												   				//插入新数据到登录表
												   				collection.insert({
												   					username:data.username,
												   					password:data.password,
												   					macAddress:mac,
												   					ipAddress:ipAddress,
												   					tempId:tempId,
												   					time:time,
												   					clientId:clientId,
												   					userAgent:userAgent
												   				},
												   				function(err,docs){
												   					db.close();
												   				});
												   			}
												   		})
										   			}else{
									   					if((parseInt(time)-parseInt(docs.time))>600*1000){
									   					//登录已经过期
									   						//生成tempId
									   						if(Cookies.tempId){
										   						var tempId=Cookies.clientId;
											   				}else{
											   					var tempId="#"+time+Math.random()
											   				}
											   				//移除过期表数据
									   						collection.remove({username:docs.username,password:docs.password,ipAddress:ipAddress,macAddress:mac,userAgent:userAgent});
									   						//更新新cookie
											   				res.setHeader('Set-Cookie', ['username='+docs.username+';path=/;domain=.'+domain+';max-age=83400',
												   					'tempId='+tempId+';path=/;domain=.'+domain,
												   					'clientId='+docs.clientId+';path=/;domain=.'+domain+';max-age=83400']);
											   				//返回信息
											   				res.end(JSON.stringify({success:true,msg:"allow"}));
											   				//插入新数据到登录表
											   				collection.insert({
											   					username:data.username,
											   					password:data.password,
											   					macAddress:mac,
											   					ipAddress:ipAddress,
											   					tempId:tempId,
											   					time:time,
											   					clientId:docs.clientId,
											   					userAgent:userAgent
											   				},
											   				function(err,docs){
											   					db.close();
											   				});
									   					}else{
									   					//已经登陆成功
									   						//更新新cookie
											   				res.setHeader('Set-Cookie', ['username='+docs.username+';path=/;domain=.'+domain+';max-age=83400',
												   					'tempId='+docs.tempId+';path=/;domain=.'+domain,
												   					'clientId='+docs.clientId+';path=/;domain=.'+domain+';max-age=83400']);
											   				//返回信息
											   				res.end(JSON.stringify({success:true,msg:"logged"}));
											   				更新最新登陆时间
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
														}

										   			}
									   			}
								   		});
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
	});
});
module.exports = router;
