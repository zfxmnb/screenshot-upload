(function(){
var socket = io();
var chatType,id=$(".self").data("username"),name=$(".self").data("name"),userid,connected=false;
    socket.emit('loginChess', {"userid":id,"username":name});
    socket.on('loginChess', function (data) {
        $("#userList ul").html("");
        $("#userList .user_num").html("在线人数："+data.onlineCount);
        for(key in data.onlineUsers){
            if(key!=id)
                 if(data.onlineUsers[key]==key)
                $("#userList ul").prepend("<li value="+key+" nickname='"+data.onlineUsers[key]+"'>"+data.onlineUsers[key]+"</li>");
                else
                    $("#userList ul").prepend("<li value="+key+" nickname='"+data.onlineUsers[key]+"'>"+data.onlineUsers[key]+"(ID:"+key+")</li>");
            else
                $("#userList .self").html("<label for='nickname'><span><i class='fa fa-pencil-square-o'></i>昵称:</span></label><big><input id='nickname' value='"+data.onlineUsers[key]+"'></big><br /><span>账号:</span>"+key)
        }
        //改名
        var nickname=$("#nickname").val();
        $("#nickname").change(function(){
            if($(this).val().length<12){
                $.ajax({url:"/chat",dataType:"JSON",type:"POST",data:"name="+$(this).val()+"&username="+id,success:function(data){
                        if(data.msg=="ok"){
                        }else{
                            $(this).val(nickname);
                        }
                    }
                })
            }else{
                $(this).val(nickname);
            }
        })
        //发送游戏请求
        $("#userList ul li").off("click").on("click",function(){
            if(!connected){
                userid=$(this).attr("value");
                username=$(this).html();
                $("#tip .to").html(username);
                var value=["request",true];
                if(userid!=id){
                    $("#bg,#tip,#send").show();
                    socket.emit('private chess',id,userid,value);
                }

                $("#send .cancel").one("click",function(){
                    var value=["request",false];
                    $("#bg,#tip,#send,#accept").hide();
                    socket.emit('private chess',id,userid,value);
                }) 
            }
        });
    });

    socket.on("logoutChess",function(data){
        $("#userList ul").html("");
        $("#userList .user_num").html("在线人数："+data.onlineCount);
        var opponent=false;
        for(key in data.onlineUsers){
            if(key!=id)
                $("#userList ul").prepend("<li value="+key+">"+data.onlineUsers[key]+" <small>[<i>"+key+"</i>]</small></li>");
            else
                $("#userList .self").html("<span>name:</span><big>"+data.onlineUsers[key]+"</big><br /><span>id:</span>"+key);
            if(userid==key)
                opponent=true;
        }
        if(!opponent){
            $("#disconnect").trigger("click");
        }
        $("#userList ul li").off();
        $("#userList ul li").on("click",function(){
            if(!connected){
                userid=$(this).attr("value");
                var username=$(this).html();
                $("#tip .to").html(username);
                var value=["request",true];
                if(userid!=id){
                    $("#bg,#tip,#send").show();
                    socket.emit('private chess',id,userid,value);
                }
                $("#send .cancel").one("click",function(){
                    var value=["request",false];
                    $("#bg,#tip,#send,#accept").hide();
                    socket.emit('private chess',id,userid,value);
                });
            }
        });
    })

    socket.on('chessto'+id, function(data) {
            var username=data[0];
            userid=data[1];
            var msg=data[2];
            if(!connected){
            if(msg[0]=="request"){
                $("#accept .from").html(username+"["+userid+"]");
                if(msg[1]==true){
                    $("#bg,#tip,#accept").show();
                    $("#accept .accept").click(function(){
                        var value=["return",true];
                        socket.emit('private chess',id,userid,value);
                        $("#bg,#tip,#accept,#send,#noIdle").hide();
                    });

                    $("#accept .refuse").click(function(){
                        var value=["return",false];
                        socket.emit('private chess',id,userid,value);
                        $("#bg,#tip,#accept,#send,#noIdle").hide(); 
                    });

                }else if(msg[1]=="retrue"){
                    $("#accept").hide(); 
                    $(".chat_container h3").html("与"+username+"对局--<span>执黑</span>");
                    connected=true;
                    identity="b";
                    prevclick(identity);
                }else if(msg[1]==false){
                    $("#bg,#tip,#accept,#send,#noIdle").hide();
                }else if(msg[1]=="no-idle"){
                    $("#accept,#send").hide();
                    $("#noIdle").show();
                    $("#noIdle .to").html(username+"["+userid+"]");
                    $("#noIdle .close").off("click").on("click",function(){
                        $("#bg,#tip,#noIdle").hide();
                    })
                }else{
                    $("#bg,#tip,#accept,#send,#noIdle").hide();
                    $("#accept .accept,#accept .refuse").off("click");
                }
            }
            if(msg[0]=="return"){
                //$("#bg,#tip").show();
                if(msg[1]==true){
                    //ok
                    var value=["request","retrue"];
                    $("#bg,#tip,#send,#accept").hide();
                    socket.emit('private chess',id,userid,value);
                    identity="w";
                    connected=true;
                    $(".chat_container h3").html("与"+username+"对局--<span>执白</span>");
                    prevclick(identity);

                    $("#tip .ok").show();
                    setTimeout(function(){
                        $("#tip .ok").hide();
                    },1000)
                }
                $("#bg,#tip,#send,#accept").hide();
            }
            }else{
                var value=["request","no-idle"];
                socket.emit('private chess',id,userid,value);
            }
            if(msg[0]=="w"||msg[0]=="b"){
                eventfn(msg[0],msg[1]);
            }
            if(msg[0]=="reset"){
                if(identity=="w"){
                    identity="b";
                    $(".chat_container h3 span").html("执黑");
                    kz=false;
                }else{
                    identity="w";
                    $(".chat_container h3 span").html("执白");
                    kz=true;
                }
                arr=arrSet(arr);
                k=null;
                w=0,b=0;
                prevclick(identity);
                reset(ctx);
            }
            if(msg[0]=="disconnect"){
                 arr=arrSet(arr);
                k=null,kz=false;
                w=0,b=0;
                identity=null;
                reset(ctx);
                $(".chat_container h3").html("");
                connected=false;
                userid=null;
            }
    });

var canvas=document.getElementById('canvas');
var ctx=canvas.getContext("2d");

//window.onload=function(){
var arr=new Array(),k=null,kz=false,identity;
var ix="w",w=0,b=0;

//数组初始化
var arrSet=function(arr){
    var arr=new Array();
    for(var i=0;i<21;i++){
        arr[i]=new Array();
        for(var j=0;j<21;j++){
            arr[i][j]=0;
        }
    }
    return arr;
}
arr=arrSet(arr);


grid(ctx);
$('#reset').click(function(){
        if(identity=="w"){
            identity="b";
            $(".chat_container h3 span").html("执黑");
            kz=false;
        }else{
            identity="w";
            $(".chat_container h3 span").html("执白");
            kz=true;
        }
        arr=arrSet(arr);
        k=null;
        w=0,b=0;
        prevclick(identity);
        reset(ctx);
         var value=["reset"];
        socket.emit('private chess',id,userid,value);
})
$("#disconnect").click(function(){
        arr=arrSet(arr);
        k=null,kz=false;
        w=0,b=0;
        identity=null;
        reset(ctx);
        var value=["disconnect"];
        socket.emit('private chess',id,userid,value);
        $(".chat_container h3").html("");
        connected=false;
        userid=null;
});
//点击
canvas.onmousedown=function(e){
    var x=e.offsetX,y=e.offsetY;
    if(x>13&&x<498&&y>13&&y<498){
        var px=parseInt((x-6)/24);
        var py=parseInt((y-6)/24);
        if(arr[px][py]==0&&k==null&&kz){
            if(identity=="w"){
                var value=["w",[px,py]];
                socket.emit('private chess',id,userid,value);

                arr[px][py]=1;
                chessDown(ctx,identity,px,py);
                w++;
                k=win(px,py,identity,arr);
                info(w,b,"b",k,ctx);
                kz=false;
            }else{
                var value=["b",[px,py]];
                socket.emit('private chess',id,userid,value);

                arr[px][py]=-1;
                chessDown(ctx,identity,px,py);
                b++;
                k=win(px,py,identity,arr);
                info(w,b,"b",k,ctx);
                kz=false;
            }
        }
    }
}

//点击结束
//}
var reset=function(ctx){
    ctx.clearRect(0,0,650,516);
    grid(ctx);
    //reset
}
function eventfn(x,y){
    var px=y[0],py=y[1];
    if(x=="w"){
        arr[px][py]=1;
        chessDown(ctx,x,px,py);
        w++;
        k=win(px,py,x,arr);
        info(w,b,"b",k,ctx);
        kz=true;
    }else{
        arr[px][py]=-1;
        chessDown(ctx,x,px,py);
        b++;
        k=win(px,py,x,arr);
        info(w,b,"w",k,ctx);
        kz=true;
    }
}
function prevclick(identity){
    if(identity=="w"){
        kz=true;
    }else if(identity=="b"){
        kz=false;
    }
}

//网格
function grid(ctx){
    ctx.fillStyle="#fff";
    ctx.fillRect(0,0,650,516);
    
    ctx.lineWidth=3;
    ctx.strokeStyle="#000";
    ctx.strokeRect(10,10,498,498);
    ctx.lineWidth=1;
    for(var i=0;i<21;i++){
        ctx.beginPath();
        ctx.moveTo(i*24+18,18);
        ctx.lineTo(i*24+18,498);
        ctx.closePath();
        ctx.strokeStyle="gray";
        ctx.stroke();
    }
    for(var i=0;i<21;i++){
        ctx.beginPath();
        ctx.moveTo(19,i*24+18);
        ctx.lineTo(498,i*24+18);
        ctx.closePath();
        ctx.strokeStyle="gray";
        ctx.stroke();
    }
    info(0,0,"w",null,ctx);
}
//点击事件

//右侧栏信息
function info(w,b,i,k,ctx){

    var captionW="白方";
    var captionB="黑方";
    if(i=="b"){
        var tipWord="黑方落子";
    }else if(i=="w"){
        var tipWord="白方落子";
    }
    if(k=="w"){
        var tipWord="白方胜";
    }else if(k=="b"){
        var tipWord="黑方胜";
    }

    ctx.clearRect(516,0,140,520);
    ctx.shadowBlur=0;
    ctx.fillStyle="#fff";
    ctx.fillRect(516,0,140,520);
    ctx.font="30px Microsoft YaHei";
    ctx.fillStyle="#000";
    ctx.fillText(captionW,520,30);
    ctx.fillText(tipWord,520,245);
    ctx.fillText(captionB,520,500);

    ctx.font="25px Arial";
    ctx.fillText(w,520,60);
    ctx.fillText(b,520,470);
}


//落子
function chessDown(ctx,i,px,py){
        if(i=="w")
            var color="#ddd";
        else
            var color="#000";
        ctx.beginPath();
        ctx.arc(px*24+17,py*24+17,10,0,2*Math.PI/180,true);
        ctx.closePath();
        ctx.shadowBlur=5;
        ctx.shadowColor="#000";
        ctx.fillStyle=color;
        ctx.fill();
}
//判断有没有五子
function win(px,py,c,arr){
    if(c=="w"){
        if(check(1,px,py,arr)>4) return c;
    }else{
        if(check(-1,px,py,arr)>4) return c;
    } 
}
//具体检测代码
function check(x,px,py,arr){
    //横向
    var n=0; 
    for(var i=px;i>-1;i--){
            if(arr[i][py]==x){
                n++;
            }else{
                break;
            }
        }
    for(var i=px+1;i<21;i++){
        if(arr[i][py]==x){
            n++;
        }else{
            break;
        }
    }
    if(n>4) return n;

    //纵向
    var n=0;
    for(var i=py;i>-1;i--){
            if(arr[px][i]==x){
                n++;
            }else{
                break;
            }
        }
    for(var i=py+1;i<21;i++){
        if(arr[px][i]==x){
            n++;
        }else{
            break;
        }
    }
    if(n>4) return n;

    //东北向
     var n=0;
    if(px+py<21){
        for(var i=px;i>-1;i--){
            if(arr[i][py+(px-i)]==x){
                n++;
            }else{
                break;
            }
        }
        for(var i=py-1;i>-1;i--){
            if(arr[px+(py-i)][i]==x){
                n++;
            }else{
                break;
            }
        }
    }else{
        for(var i=px;i<21;i++){
            if(arr[i][py+(px-i)]==x){
                n++;
            }else{
                break;
            }
        }
        for(var i=py+1;i<21;i++){
            if(arr[px+(py-i)][i]==x){
                n++;
            }else{
                break;
            }
        }
    }
    if(n>4) return n;

    //东南向
    var n=0;
    if(px>py){
        for(var i=px+1;i<21;i++){
            if(arr[i][py+(i-px)]==x){
                n++;
            }else{
                break;
            }
        }
        for(var i=py;i>-1;i--){
            if(arr[px-(py-i)][i]==x){
                n++;
            }else{
                break;
            }
        }
    }else{
        for(var i=px;i>-1;i--){
            if(arr[i][py-(px-i)]==x){
                n++;
            }else{
                break;
            }
        }
        for(var i=py+1;i<21;i++){
            if(arr[px+(i-py)][i]==x){
                n++;
            }else{
                break;
            }
        }
    }
    if(n>4) return n;
}
})();