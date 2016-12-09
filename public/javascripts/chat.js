(function(){
var socket = io();
var chatType,id,name;
    id=$(".self").data("username");
    name=$(".self").data("name");
    socket.emit('login', {"userid":id,"username":name});

    socket.on('login', function (data) {
        $('#chat_contents .commonality .chat_content').append("<div class='tips'><span>欢迎用户"+data.user+"加入房间</span></div>");
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
        event();
    });
    socket.on('logout', function(data) {
        $("#userList ul").html("");
        $("#userList .user_num").html("在线人数："+data.onlineCount);
        for(key in data.onlineUsers){
            if(key!=id)
                if(data.onlineUsers[key]==key)
                $("#userList ul").prepend("<li value="+key+" nickname='"+data.onlineUsers[key]+"'>"+data.onlineUsers[key]+"</li>");
                else
                    $("#userList ul").prepend("<li value="+key+" nickname='"+data.onlineUsers[key]+"'>"+data.onlineUsers[key]+"(ID:"+key+")</li>");
            else
                $("#userList .self").html("<span>昵称:</span><big>"+data.onlineUsers[key]+"</big><br /><span>账号:</span>"+key)
        }
        event();
    });
    socket.on('to'+id, function(data) {
        var username=data[0];
        var userid=data[1];
        var msg=data[2];

        eventfn(userid,username);
        var time=new Date();
         var y=1900+time.getYear(),M=time.getMonth()+1,d=time.getDate();
        var h=time.getHours(),
        m=time.getMinutes()<10?"0"+time.getMinutes():time.getMinutes(),
        s=time.getSeconds()<10?"0"+time.getSeconds():time.getSeconds();
        var ele=$('.'+userid);
        ele.find(".chat_content").append("<div class='other'>"+
            "<div class='text'>"+y+"-"+M+"-"+d+"  "+h+":"+m+":"+s+"</div>"+
            "<span class='username'>"+username+"</span><span class='msg'>"+emojiexplain(msg)+"</span></div>");
        ele.scrollTop(1000000);
    });

    socket.on('chat message', function (data) {
        var username=data[0];
        var userid=data[1];
        var msg=data[2];
        if(userid==id){
            var c="me";
        }else{
            var c="other";
        }
        var time=new Date();
        var y=1900+time.getYear(),M=time.getMonth()+1,d=time.getDate();
         var h=time.getHours(),
            m=time.getMinutes()<10?"0"+time.getMinutes():time.getMinutes(),
            s=time.getSeconds()<10?"0"+time.getSeconds():time.getSeconds();
        var ele=$(".commonality");
        ele.find('.chat_content').append("<div class="+c+">"+
            "<div class='text'>"+y+"-"+M+"-"+d+"  "+h+":"+m+":"+s+"</div>"+
            "<span class='username'>"+username+"</span><span class='msg'>"+emojiexplain(msg)+"</span></div>");
        $(".commonality_title").trigger("click");
        ele.scrollTop(1000000);
    });
    emit();
    emoji();
    universally("commonality");
//}

function emoji(){
    var string="";
    for(var i=0;i<105;i++){
        var x=parseInt(i/15),y=i%15;
        string+="<li class='emoji("+x+","+y+")' style='background-position:"+(-y*26)+"px "+(-x*26-5)+"px;'></li>";
     }
     $("#emojiCon").html(string);
      emojiClick();
      //$("#userList,.chat_content").click(function(){$("#emojiCon").fadeOut(200);})
 }
 function emojiClick(){
     var eleLi=$("#emojiCon").find("li");
     eleLi.on("click",function(){
        var pos=$(this).index("#emojiCon li");
        var emoji="[emoji("+pos+")]";
        var input=$("#chat_contents .active .input");
        input.val(input.val()+emoji);
     });
 }
 function emojiexplain(string){
    var arr=string.split("[emoji(");
    var newString="";
    for(var i=0;i<arr.length;i++){
        if(i>0){
            var s=arr[i].split(")]")[0];
            if((s-0)>-1&&(s-0)<105){
                var x=parseInt(s/15);
                var y=s%15;
                var str2=arr[i].split(")]")[1]||"";
                newString+="<i class='emojiOcc' style='background-position:"+(-y*26)+"px "+(-x*26-5)+"px;'></i>"+str2;
            }else{
                var str2=arr[i].split(")]")[1]?")]"+arr[i].split(")]")[1]:"";
                newString+="[emoji("+s+str2;
            }
        }else{
            newString+=arr[i];
        }
    }
    return newString
 }
function event(){
    $("#userList ul li").off();
    $("#userList ul li").on("click",function(){
            var userid=$(this).attr("value");
            var username=$(this).html();
        if(userid!=id)
            eventfn(userid,username);
    });
}
function universally(userid){
    $(".history").off("click").on("click",function(){
            $(this).hide();
            $.ajax({url:"/msg",dataType:"JSON",type:"POST",data:"from="+id+"&to="+userid,success:function(data){
                    var ele=$('.'+userid);
                    ele.find('.chat_content').empty();
                    for(var i=0;i<data.length;i++){
                        var da=data[i].split("/##/");
                        var time=new Date()
                        time.setTime(da[0]-0);
                        var y=1900+time.getYear(),M=time.getMonth()+1,d=time.getDate();
                         var h=time.getHours(),
                            m=time.getMinutes()<10?"0"+time.getMinutes():time.getMinutes(),
                            s=time.getSeconds()<10?"0"+time.getSeconds():time.getSeconds();
                        var from=da[1].split("&")[0];
                        var msg=da[2];
                        if(from==id){
                            from=$("#nickname").val();
                            var c="me";
                        }else{
                            $("#userList ul li").each(function(){
                                if($(this).attr("value")==from){
                                    from=$(this).attr("nickname");
                                }
                            })
                            var c="other"
                        }
                        ele.find('.chat_content').append("<div class="+c+">"+
                            "<div class='text'>"+y+"-"+M+"-"+d+"  "+h+":"+m+":"+s+"</div>"+
                            "<span class='username'>"+from+"</span><span class='msg'>"+emojiexplain(msg)+"</span></div>");
                        ele.scrollTop(1000000);
                    }
                }
            })
     });
    $(".emojiButton").off("click").on("click",function(){
        if($(this).hasClass("active")){
            $(this).removeClass("active");
            $("#emojiCon").fadeOut(300);
        }else{
            $(this).addClass("active");
            $("#emojiCon").fadeIn(300);
        }
    });
    $("#userList,.chat_content").click(function(){
        $("#emojiCon").fadeOut(200);
    })

}
function eventfn(userid,username){
    if($("#tab_title").find("."+userid).length>0){
            $("#tab_title").find("."+userid).trigger("click");
        }else{
            $("#tab_title ul").append("<li class='title "+userid+"' userId='"+userid+"'><span class='text'>"+username+"</span><span class='close'>x</span></li>");

            $("#chat_contents").append('<li class="'+userid+'" value="'+userid+'">'+
                    '<div class="chat_content"><div class="tips"><span>可以和'+username+'聊天了</span></div><div class="tips history"><span>查看聊天历史</span></div></div>'+
                    '<div class="chat_submit">'+
                    '<div class="input_con"><input type="text" class="input"><i class="emojiButton"></i></div>'+
                        '<button class="submit">提交</button>'+
                    '</div>'+
                '</li>');
        }
        universally(userid);
         $("#tab_title .title").each(function(index){
            $(this).off("click").on("click",function(){
                $("#tab_title .title").removeClass("active");
                $(this).addClass("active");
                $("#chat_contents>li").removeClass("active");
                $("#chat_contents>li").eq(index).addClass("active");
                if($(this).find(".text").html()!="commonality")
                    $("#tab_title h1").html($(this).find(".text").html());
                else
                    $("#tab_title h1").html($(this).find(".text").html());
            });
        });
         $("#tab_title").find("."+userid).trigger("click");

        $("#tab_title .title .close").each(function(index){
            $(this).off();
            $(this).on("click",function(){
                $(this).parents("li").remove();
                $("#chat_contents>li").eq(index+1).remove();
                $(".commonality_title").trigger("click");
            })
        });
        emit()
}
function emit(){
    $('.submit').off("click").on("click",function(){
        submit($(this))
    });
    $(document).off("keydown").on("keydown",function(e){
        if(e.keyCode==13)
            submit($("#chat_contents .active .submit"))
    })
}
function submit(e){
        var value=e.parent().find(".input").val();
        if(value!=""&&value.indexOf("/**/")==-1&&value.indexOf("/##/")==-1){
            var to=e.parents("li").attr("value");
            if(to=="commonality")
            socket.emit('chat message',id,to,value);
            else{
                socket.emit('private message',id,to,value);
                var time=new Date();
                var y=1900+time.getYear(),M=time.getMonth()+1,d=time.getDate();
                 var h=time.getHours(),
                    m=time.getMinutes()<10?"0"+time.getMinutes():time.getMinutes(),
                    s=time.getSeconds()<10?"0"+time.getSeconds():time.getSeconds();
                var ele=$('.'+to);
                ele.find(".chat_content").append("<div class='me'>"+
                    "<div class='text'>"+y+"-"+M+"-"+d+"  "+h+":"+m+":"+s+"</div>"+
                    "<span class='username'>"+name+"</span><span class='msg'>"+emojiexplain(value)+"</span></div>");
                ele.scrollTop(1000000);
            }
            e.parent().find(".input").val('');
            $("#emojiCon").fadeOut(200);
        }
        return false;
}
})();