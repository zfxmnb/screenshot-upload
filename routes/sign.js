var express = require('express');
var router = express.Router();
var app=express();
var macObj = require('getmac');
var sign = require('singleLogin');
var macObj = require('getmac');
/* GET home page. */
router.post('/', function(req, res, next) {
	var collectionId="sign";
 	sign.auth(collectionId,function(collection){
 		var db=this;
 		var data=req.body;
 		collection.find({username:data.username}).toArray(function (err,docs){
 			if(err) throw err;
 			else{
 				if(data.type=="signin"){
	 				if(!docs.length>0){
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
	 				if(docs.length>0&&data.password==docs[0].password){
	 					db.collection("singlelogin",function(err,collection_1){
					    	if(err) throw err;
					        else{
					        	macObj.getMac(function(err,macAddress){
								    if (err)  throw err;
								   	else{
								   		var time=new Date().getTime();
								   		collection_1.find({username:data.username,password:data.password}).toArray(function (err,docs){
								   			if(!docs.length>0){
								   				var clientId=time+Math.random();
								   				res.setHeader('Set-Cookie', [ 'username='+data.username+';path=/;max-age=600','clientId='+clientId+';path=/;max-age=600']);
								   				res.end(JSON.stringify({success:true,mas:"allow"}));
								   				collection_1.insert({username:data.username,password:data.password,mac:macAddress,time:time,clientId:clientId},function(err,docs){
								   					db.close();
								   				});
								   			}else{
								   				res.setHeader('Set-Cookie', [ 'username='+data.username+';path=/;max-age=600','clientId='+docs[0].clientId+';path=/;max-age=600']);
								   				res.end(JSON.stringify({success:true,mas:"allow"}));
								   				collection_1.update(
												  {username:data.username,password:data.password},
												  {$set:{mac:macAddress,time:time}},
												  function(err,docs){
												  	
												  	db.close();
												  });
								   			}
								   		});
								   		
								   	}
								});
					        }
					    });

	 				}else{
	 					res.end(JSON.stringify({success:false,mas:"unregistered"}));
	 					db.close();
	 				}
	 				
	 			}
 			}
 		});
 	});
});

module.exports = router;
