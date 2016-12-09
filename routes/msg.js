var express = require('express');
var router = express.Router();
var app=express();

var mongo=require("mongodb");
var host="localhost";
var server=new mongo.Server(host,27017,{auto_reconnect:true});//创建数据库所在的服务器服务器
var db=new mongo.Db("node",server,{safe:true});

router.post('/', function(req, res, next) {
	db.open(function (err,db) {
	    db.collection("messages",function(err,collection){
	    	if(req.body.to=="commonality")
	    		var term={rel:"commonality"};
	    	else
	    		var term={$or:[{rel:req.body.from+"&"+req.body.to},{rel:req.body.to+"&"+req.body.from}]};
	    	 collection.findOne(term,function (err,docs){
	    	 	if(err) throw err;
	    	 	else{
	    	 		if(docs){
	    	 			var m=docs.massage+"";
	    	 			var msg=m.split("/**/");
	    	 			if(msg.length>30){
	    	 				var stringArr=msg.splice(1,msg.length-15);
	    	 				var string="";
	    	 				for(var i=0;i<stringArr.length;i++){
	    	 					if(i<stringArr.length-1){
									string+=stringArr[i]+"/**/";
	    	 					}else{
	    	 						string+=stringArr[i];
	    	 					}
	    	 				}
	    	 				res.end(JSON.stringify(stringArr));
	    	 				collection.updateOne({rel:docs.rel},{$set:{massage:string}},function(err){
	    	 					if(err) throw err;
								else
	    	 					db.close();
	    	 				});
	    	 			}else{
	    	 				var string=JSON.stringify(msg);
	    	 				res.end(string);
	    	 				db.close();
	    	 			}
	    	 		}else{
	    	 				res.end("{success:'err',msg:'no-found'}");
	    	 				db.close();
	    	 		}
	    	 	}
	    	 })
		});
	});
});

module.exports = router;