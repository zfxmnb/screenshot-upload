var express = require('express');
var router = express.Router();
var app=express();
var macObj = require('getmac');

/* GET home page. */
router.get('/', function(req, res, next) {
	macObj.getMac(function(err,macAddress){
	    if (err)  throw err;
	    mac=macAddress;
	    console.log(mac);
	});
 	res.render("login");
});

module.exports = router;
