// zxx.crop_rotation.js by zhangxinxu  welcome to visit my personal website http://www.zhangxinxu.com/
// 2010-05-06 v1.0 beta
// 2010-05-07 v1.1 让剪裁box高度随着canvas高度增加而增加
// 图片剪裁旋转前端展示
/*一些说明:
* 1. 旋转效果查看需通过在角度文本框中输入数值
* 2. 后台处理图片需要5个参数，剪裁起始点，以及剪裁的高宽，这5个参数均可以通过id获取。其中角度值即旋转角度输入框的值，id为zxxRotAngle，坐标及高宽参数分别藏在4个隐藏的文本框中，id分别是：cropPosX, cropPosY, cropImageWidth, cropImageHeight
* 3. 自动对比当前图片与原始图片尺寸比例，计算实际的剪裁值，对于高度及位置溢出也做了处理
* 4. 如果出现由于图片旋转而发生遮挡的现象，设置遮挡元素的position属性为relative，z-index为1，可修复此问题
* 5. 经我测试，excanvas.js需在头部加载以支持IE浏览器的canvas
*/
var fnImageCropRot = function(o){
	//o为图片对象
	if(typeof(o) === "object" && o.tagName.toLowerCase() === "img"||o.tagName.toLowerCase() === "canvas"){//检测是否是图片类型的DOM对象
		//当前显示图片的高度和宽度
		var iCurWidth = o.width, iCurHeight = o.height;
		o.height = iCurHeight;
		//获取实际图片的高宽
		if(o.tagName.toLowerCase() === "img"){
			var oCreateImg = new Image();
			oCreateImg.src = o.src;
			var iOrigWidth = oCreateImg.width, iOrigHeight = oCreateImg.height;
		}else{
			var iOrigWidth =o.width,iOrigHeight =o.height; 
		}
		
		
		if(iCurWidth && iOrigWidth){//如果宽度为不为0 - 意味着加载成功
			//计算当前与实际的纵横比
			var scaleX = iCurWidth / iOrigWidth;
			var scaleY = iCurHeight / iOrigHeight;			
			//实现图片对象的包裹
			//创建包裹div
			var oRelDiv = document.createElement("div");
			oRelDiv.style.position = "relative";
			oRelDiv.style.width = iCurWidth + "px";
			oRelDiv.style.height = iCurHeight + 30 + "px";
			oRelDiv.style.top = "0px";
			oRelDiv.id="dragcontainer"
			//定义ID方法
			var ID = function(id){
				return document.getElementById(id);
			};
			//插入到当前图片对象之前
			o.parentNode.insertBefore(oRelDiv, o);
			//初始化坐标与剪裁高宽
			var cropW = 50, cropH = 50;
			var posX = (iCurWidth - cropW)/2, posY = (iCurHeight - cropH)/2;
			//剪裁需要的HTML元素
			var sInnerHtml = '<div id="zxxCropBox" style="height:'+cropH+'px; width:'+cropW+'px; position:absolute; left:'+posX+'px; top:'+posY+'px; border:1px solid black;"><div id="zxxDragBg" style="height:100%; background:white; opacity:0.3; filter:alpha(opacity=30); cursor:move;"></div><div id="dragTopCenter" style="position:absolute; width:4px; height:4px; border:1px solid #000; background:white; overflow:hidden; top:-3px; left:50%; margin-left:-3px; cursor:n-resize;"></div><div id="dragBotCenter" style="position:absolute; width:4px; height:4px; border:1px solid #000; background:white; overflow:hidden; bottom:-3px; left:50%; margin-left:-3px; cursor:s-resize;"></div><div id="dragRightCenter" style="position:absolute; width:4px; height:4px; border:1px solid #000; background:white; overflow:hidden; right:-3px; top:50%; margin-top:-3px; cursor:e-resize;"></div><div id="dragLeftCenter" style="position:absolute; width:4px; height:4px; border:1px solid #000; background:white; overflow:hidden; left:-3px; top:50%; margin-top:-3px; cursor:w-resize;"></div></div><input type="hidden" id="cropPosX" value="'+posX/scaleX+'" /><input type="hidden" id="cropPosY" value="'+posY/scaleY+'" /><input type="hidden" id="cropImageWidth" value="'+cropW/scaleX+'" /><input type="hidden" id="cropImageHeight" value="'+cropH/scaleY+'" />';
			//'
			//嵌入HTML元素
			oRelDiv.innerHTML = sInnerHtml;
			//图片重新插入
			var oCanvas = ID("zxxImageCanvas");
			// if(window.ActiveXObject && window.G_vmlCanvasManager){
			// 	//IE
			// 	oCanvas = window.G_vmlCanvasManager.initElement(oCanvas); //使IE支持动态创建的canvas元素
			// }
			oRelDiv.insertBefore(o, oCanvas);
			//拖拽与拉伸方法
			//拖拽拉伸所需参数
			var params = {
				left: 0,
				top: 0,
				width:0,
				height:0,
				currentX: 0,
				currentY: 0,
				flag: false,
				kind: "drag"
			};
			//获取相关CSS属性方法
			var getCss = function(o,key){
				return o.currentStyle? o.currentStyle[key] : document.defaultView.getComputedStyle(o,false)[key]; 	
			};
			var startDrag = function(point, target, kind){	
				//point是拉伸点，target是被拉伸的目标，其高度及位置会发生改变
				//此处的target与上面拖拽的target是同一目标，故其params.left,params.top可以共用，也必须共用
				//初始化宽高
				params.width = getCss(target, "width");
				params.height = getCss(target, "height");
				//初始化坐标
				if(getCss(target, "left") !== "auto"){
					params.left = getCss(target, "left");
				}
				if(getCss(target, "top") !== "auto"){
					params.top = getCss(target, "top");
				}
				//target是移动对象
				point.onmousedown = function(event){
					params.kind = kind;
					params.flag = true;
					if(!event){
						event = window.event;
					}
					var e = event;
					params.currentX = e.clientX;
					params.currentY = e.clientY;
					//防止IE文字选中，有助于拖拽平滑
					point.onselectstart = function(){
						return false;
					}
					return false;  
				};
				ID("dragcontainer").onmouseup = function(){
					params.flag = false;	
					if(getCss(target, "left") !== "auto"){
						params.left = getCss(target, "left");
					}
					if(getCss(target, "top") !== "auto"){
						params.top = getCss(target, "top");
					}
					params.width = getCss(target, "width");
					params.height = getCss(target, "height");
					
					//给隐藏文本框赋值
					posX = parseInt(target.style.left);
					posY = parseInt(target.style.top);
					cropW = parseInt(target.style.width);
					cropH = parseInt(target.style.height);
					
					if(posX < 0){
						posX = 0;	
					}
					if(posY < 0){
						posY = 0;
					}
					/*if((posX + cropW) > iCurWidth){
						cropW = iCurWidth - posX;	
					}
					if((posY + cropH) > iCurHeight){
						cropH = iCurHeight - posY;	
					}*/
					
					
					//比例计算
					posX /= scaleX;
					posY /= scaleY;
					cropW /= scaleX;
					cropH /= scaleY;
					//赋值
					ID("cropPosX").value = posX;
					ID("cropPosY").value = posY;
					ID("cropImageWidth").value = cropW;
					ID("cropImageHeight").value = cropH;
				};
				document.onmousemove = function(event){
					var e = event ? event: window.event;
					if(params.flag){
						var nowX = e.clientX, nowY = e.clientY;//dragLeft=ID('dragcontainer').offsetLeft,dragTop=ID('dragcontainer').offsetTop,dragBottom=ID('dragcontainer').offsetBottom;
						var disX = nowX - params.currentX, disY = nowY - params.currentY;

						if(params.kind === "n"){
							//上拉伸
							//高度增加或减小，位置上下移动
							target.style.top = parseInt(params.top) + disY + "px";
							target.style.height = parseInt(params.height) - disY + "px";
							target.style.width= parseInt(params.height) - disY + "px";
						}else if(params.kind === "w"){//左拉伸
							target.style.left = parseInt(params.left) + disX + "px";
							target.style.width = parseInt(params.width) - disX + "px";
							target.style.height = parseInt(params.width) - disX + "px";
						}else if(params.kind === "e"){//右拉伸
							target.style.width = parseInt(params.width) + disX + "px";
							target.style.height = parseInt(params.width) + disX + "px";
						}else if(params.kind === "s"){//下拉伸
							target.style.height = parseInt(params.height) + disY + "px";
							target.style.width = parseInt(params.height) + disY + "px";
						}else if(params.kind === "nw"){//左上拉伸
							target.style.left = parseInt(params.left) + disX + "px";
							target.style.width = parseInt(params.width) - disX + "px";
							target.style.top = parseInt(params.top) + disY + "px";
							target.style.height = parseInt(params.height) - disY + "px";
						}else if(params.kind === "ne"){//右上拉伸
							target.style.top = parseInt(params.top) + disY + "px";
							target.style.height = parseInt(params.height) - disY + "px";
							//右
							target.style.width = parseInt(params.width) + disX + "px";
						}else if(params.kind === "sw"){//左下拉伸
							target.style.left = parseInt(params.left) + disX + "px";
							target.style.width = parseInt(params.width) - disX + "px";
							//下
							target.style.height = parseInt(params.height) + disY + "px";
						}else if(params.kind === "se"){//右下拉伸
							target.style.width = parseInt(params.width) + disX + "px";
							target.style.height = parseInt(params.height) + disY + "px";
						}else{//移动
							target.style.left = parseInt(params.left) + disX + "px";
							target.style.top = parseInt(params.top) + disY + "px";
						}
					}
				}	
			};
			
			//绑定拖拽
			startDrag(ID("zxxDragBg"),ID("zxxCropBox"),"drag");
			//绑定拉伸
			//startDrag(ID("dragLeftTop"),ID("zxxCropBox"),"nw");
			//startDrag(ID("dragLeftBot"),ID("zxxCropBox"),"sw");
			//startDrag(ID("dragRightTop"),ID("zxxCropBox"),"ne");
			//startDrag(ID("dragRightBot"),ID("zxxCropBox"),"se");
			startDrag(ID("dragTopCenter"),ID("zxxCropBox"),"n");
			startDrag(ID("dragBotCenter"),ID("zxxCropBox"),"s");
			startDrag(ID("dragRightCenter"),ID("zxxCropBox"),"e");
			startDrag(ID("dragLeftCenter"),ID("zxxCropBox"),"w");
			
			//图片不能被选中，目的在于使拖拽顺滑
			// ID("zxxImageCanvas").onselectstart = function(){
			// 	return false;
			// };
			o.onselectstart = function(){
				return false;
			};
		}//if end
	}//if end
};