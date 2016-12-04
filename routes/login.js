var express = require('express');
var router = express.Router();
var app=express();
var macObj = require('getmac');
var sign = require('singleLogin');
/* GET home page. */
router.get('/', function(req, res, next) {
	sign.auth("singlelogin",function(collection){
		var db=this;
		var userAgent=req.headers["user-agent"];
		var ipAddress=(req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress);
		//获取

		macObj.getMac(function(err,mac){
		    if (err)  throw err;
		   	else{
		   		if(req.query.type=="logout"){
		   			res.end(JSON.stringify({success:true,msg:"logout"}));
					collection.remove(
	   					{ipAddress:ipAddress,macAddress:mac,userAgent:userAgent},function(err){
	   						db.close();
	   					}
	   				);
				}else{
			   		collection.findOne({ipAddress:ipAddress,macAddress:mac,userAgent:userAgent},function (err,docs){
			   			if(err) throw err;
						else{
							var time=new Date().getTime();
							if(req.query.target)
								var Referer=req.query.target;
							else
								var Referer="/";
							var domain=req.headers["host"].split(":")[0];
							if(docs&&Referer&&(time-parseInt(docs.time))<600*1000){
								res.setHeader('Set-Cookie', ['username='+docs.username+';path=/;domain=.'+domain+';max-age=83400',
										   					'tempId='+docs.tempId+';path=/;domain=.'+domain,
										   					'clientId='+docs.clientId+';path=/;domain=.'+domain+';max-age=83400']);
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
				}
		   	}
		});
	});
});

module.exports = router;
