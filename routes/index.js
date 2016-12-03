var express = require('express');
var router = express.Router();
var app=express();
var mongo=require("mongodb");
var sign = require('singleLogin');

router.get('/', function(req, res, next) {
	sign.verification(req,res,"/login",function(collection){
		res.render("index");
	})
});

module.exports = router;
