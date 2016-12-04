var express = require('express');
var router = express.Router();
var app=express();
var sign = require('singleLogin');

router.get('/', function(req, res, next) {
	sign.verification(req,res,"/login","/test",function(collection,userinfo){
		res.render("test",userinfo);
	})
});

module.exports = router;
