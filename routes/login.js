var express = require('express');
var router = express.Router();
var app=express();
var macObj = require('getmac');
var sign = require('singleLogin');
/* GET home page. */
router.get('/', function(req, res, next) {
	
	//sign.verification(req,res,"/",function(collection){
		//res.redirect("/");
	//});
 	res.render("login");
});

module.exports = router;
