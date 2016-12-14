var express = require('express');
var router = express.Router();
var app=express();
var fs=require('fs');
 var multiparty = require('multiparty');

// var multipart = require('connect-multiparty');
// var multipartMiddleware = multipart();

router.get('/',function(req, res, next) {
		res.render("personage");
});
router.post('/',function(req, res, next) {
	//res.setHeader("content-Type","text/html,charset=UTF-8");
	//console.log(req.body.imgData)
	 // var form = new multiparty.Form({uploadDir: 'public/images/',maxFilesSize:2 * 1024 * 1024});
	 //  //上传完成后处理
	 //  form.parse(req, function(err, fields, files) {
	 //  	console.log(err);
	 //  	console.log(fields);
	 //  	console.log(files);
	 //  });

	if(req.body.imgData&&req.body.imgName){
		var imgdata=decodeURI(req.body.imgData);var imgname=req.body.imgName
		console.log()
		var base64Data = imgdata.replace(/^data:image\/\w+;base64/, "");
    	var dataBuffer = new Buffer(base64Data,'base64');
    	fs.writeFileSync("public/images/test2.png",dataBuffer);
		var currData=fs.readdirSync("public/images/");
		var jsonData={images:currData};
		res.end(JSON.stringify(jsonData));
		//console.log(imgdata)
	}else{
		res.end('{success:false}');
	}
});
module.exports = router;