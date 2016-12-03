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
	 				if(!docs.username){
	 					var user=new RegExp("^[a-z]*$");
	 					if(user.test(data.username)&&data.username.length>3&&data.username.length<12&&data.password.length>5&&data.password.length<15){
	 						collection.insert({username:data.username,password:data.password});
	 						res.end(JSON.stringify({success:true,mas:"register success"}));
	 					}else{
	 						res.end(JSON.stringify({success:false,mas:"register failed"}));
	 					}
	 					db.close();
	 				}else{
	 					res.end(JSON.stringify({success:false,mas:"registered"}));
	 					db.close();
	 				}
	 			}else if(data.type=="login"){
	 				if(docs&&data.password==docs.password){
	 					db.collection("singlelogin",function(err,collection){
					    	if(err) throw err;
					        else{
						   		var time=new Date().getTime();
								var userAgent=req.headers["user-agent"];  
								macObj.getMac(function(err,mac){
								    if (err)  throw err;
								   	else{
								   		var Address=(req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress)+mac;
								   		var time=new Date().getTime();
								   		collection.findOne({username:data.username,password:data.password,Address:Address,userAgent:userAgent},function (err,docs){
								   			if(err) throw err;
											else{
													//console.log(docs)
										   			if(!docs){
										   				var clientId=uuid.v1();
										   				res.setHeader('Set-Cookie', ['username='+data.username+';path=/;max-age=600','clientId='+clientId+';path=/;max-age=600']);
										   				res.end(JSON.stringify({success:true,mas:"allow"}));

										   				collection.insert({
										   					username:data.username,
										   					password:data.password,
										   					Address:Address,
										   					time:time,
										   					clientId:clientId,
										   					userAgent:userAgent
										   				},
										   				function(err,docs){
										   					db.close();
										   				});
										   			}else{	
									   					if((parseInt(time)-parseInt(docs.time))>600*1000){
									   						collection.remove({username:data.username,password:data.password,Address:Address,userAgent:userAgent});
									   						var clientId=uuid.v1();
											   				res.setHeader('Set-Cookie', ['username='+docs.username+';path=/;max-age=600','clientId='+clientId+';path=/;max-age=600']);
											   				res.end(JSON.stringify({success:true,mas:"allow"}));

											   				collection.insert({
											   					username:data.username,
											   					password:data.password,
											   					Address:Address,
											   					time:time,
											   					clientId:clientId,
											   					userAgent:userAgent
											   				},
											   				function(err,docs){
											   					db.close();
											   				});
									   					}else{
											   				res.setHeader('Set-Cookie', [ 'username='+docs.username+';path=/;max-age=600','clientId='+docs.clientId+';path=/;max-age=600']);
											   				res.end(JSON.stringify({success:true,mas:"logged"}));

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
						res.end(JSON.stringify({success:false,mas:"password error"}));
 						db.close();
					}
 				}else{
 					res.end(JSON.stringify({success:false,mas:"unregistered"}));
 					db.close();
 				}
	 				
 			}
		});
	});
	 
});
module.exports = router;
