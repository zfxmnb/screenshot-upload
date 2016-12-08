var express = require('express');
var router = express.Router();
var app=express();
var sign = require('singleLogin');

router.get('/', function(req, res, next) {
	sign.verification(req,res,"/login","/chess",function(collection,userinfo){
		res.render("chess",userinfo);
	})
});

module.exports = router;
