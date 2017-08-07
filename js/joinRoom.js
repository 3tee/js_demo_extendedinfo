//导入3tee sdk后，定义变量，用于调用接口
var AVDEngine = ModuleBase.use(ModulesEnum.avdEngine);
var avdEngine = new AVDEngine();
avdEngine.initDevice(); //初始化设备

//获取url中的各个参数
var serverURI = GetQueryString("serverURI");
var accessToken = GetQueryString("accessToken");
var roomId = GetQueryString("roomId");
var userId = GetQueryString("userId");
var userName = GetQueryString("userName");

$("#showUserName").html("当前用户:" + userName);

var joinRoomBtn = document.getElementById("joinRoomBtn");
var leaveRoomBtn = document.getElementById("leaveRoomBtn");
var userListUl = document.getElementById("userList");

//记录操作是否完成的变量
var joinRoomSuccess = false;

//设置日志级别，初始化
avdEngine.setLog(Appender.browserConsole, LogLevel.error);
avdEngine.init(serverURI, accessToken).then(initSuccess).otherwise(showError);

function initSuccess() {}

//加会
function joinRoom() {
	room = avdEngine.obtainRoom(roomId);
	showResult('加会中', 'blue');
	room.join(userId, userName, '', '').then(joinSuccess).otherwise(showError);
}

//加会成功操作，包括设置房间级别的回调和会议中所有用户的回调
function joinSuccess() {
	console.log(room);
	showResult('加会成功', 'blue');
	joinRoomSuccess = true;
	registerRoomCallback();
 	participantsHandle(room.getParticipants());

	leaveRoomBtn.style.display = "inline";
	joinRoomBtn.style.display = "none";
}

/**
 * 注册房间级别的回调
 */
function registerRoomCallback() {
	room.addCallback(RoomCallback.user_join_notify, onUserJoinNotify);
	room.addCallback(RoomCallback.user_leave_notify, onUserLeaveNotify);
	
    room.addCallback(RoomCallback.app_data_notify, onAppdataNotify);
    room.addCallback(RoomCallback.user_data_notify, onUserDataNotify);
}

/**
 * @desc 参会者加会回调
 * @param {Object} users － 参会者数组
 */
function onUserJoinNotify(users) {
	participantsHandle(users,"newJoin");
}

/**
 * @desc 参会者退会回调
 * @param {int} opt - 退会类型
 * @param {int} reason  - 退会原因
 * @param {Object} user - 退会用户
 */
function onUserLeaveNotify(opt, reason, user) {
	//服务器端报807错误，说明UDP不通或UDP连接超时
	if(reason == 807 && user.id == room.selfUser.id) {
		showResult("807错误，UDP不通或UDP连接超时！", 'red');
		return;
	}else{
		participantsHandle(user,"leave");
	}
}

/**
 * 更新用户扩展内容
 */
function updateUserData(){
	var userDataMsg = document.getElementById('userDataMsg').value;
	if (strUtil.isEmpty(userDataMsg)) {
		return;
	} else {
		room.selfUser.updateUserData(userDataMsg);
		var val = document.getElementById('userDataColl').innerHTML;
		var prefix = "";
		if (!strUtil.isEmpty(val)) {
			prefix = "\r\n";
		}
		val += prefix + room.selfUser.name + "：" + userDataMsg;
		document.getElementById("userDataColl").innerHTML = val;
		document.getElementById('userDataMsg').value = "";
		document.getElementById('userDataMsg').focus();
	}
}

/**
 * 用户扩展内容更新回调
 * @param {String} userData - 用户扩展内容
 * @param {String} userId - 用户id
 */
function onUserDataNotify(userData, userId ) {
	var val = document.getElementById('userDataColl').innerHTML;
	var prefix = "";
	if (!strUtil.isEmpty(val)) {
		prefix = "\r\n";
	}
	val += prefix + room.getUser(userId).name + "：" + userData;
	document.getElementById("userDataColl").innerHTML = val;
}

/**
 * 获得用户的扩展内容
 */
function getUserData() {
	var userDataUserId = $("#userList .current").attr("userId")?$("#userList .current").attr("userId"):"";
	var viewUserData = document.getElementById('viewUserData');
	var userData =room.selfUser.getUserData(userDataUserId);
	viewUserData.value = userData;
}



/**
 * 更新房间应用扩展字段
 */
function updateAppData(){
    var appDataKV = document.getElementById('appDataKV').value;
    if(appDataKV ==null || appDataKV==''){
	    return;
	}else{
	 	var kvSp=appDataKV.split(':');
	 	room.updateAppData(kvSp[0],kvSp[1]);
 	 	  
 	 	var val = document.getElementById('appDataColl').innerHTML;
        var prefix="";
        if(val  !=null &&  val !=""){
            prefix="\r\n";
        }
        val+= prefix + room.selfUser.name+"：" + appDataKV;	
        document.getElementById("appDataColl").innerHTML=val;
        document.getElementById('appDataKV').value="";
        document.getElementById('appDataKV').focus();
	}
}


/**
 * 房间应用扩展字段回调
 * @param {object} appData - 间应用扩展字段
 */
function onAppdataNotify(appData) {
    if(appData !=null){
    	for (var i = 0; i != appData.length; ++i) {
			var kv = appData[i];
			var val = document.getElementById('appDataColl').innerHTML;
		    var prefix="";
		    if(val  !=null &&  val !=""){
		 	    prefix="\r\n";
		    }
		    val+= prefix + kv.key+"："+kv.value;	
		    document.getElementById("appDataColl").innerHTML=val; 
		}
    }
}


/**
 * 获得房间应用扩展字段内容
 */
function getAppData(){
	console.log(room);
	var appDataKey = document.getElementById('appDataKey').value;
	var appData =room.getAppData(appDataKey);
	if(typeof(appData)!='undefined' && typeof(appData)!='object' ){
		document.getElementById("viewAppDataValue").innerHTML=appData;  
	}else{
		if(appData !=null){
			var val= '';
    	    for (var key in appData) {
			  	var value = appData[key];
		      	var prefix="";
		      	if(val  !=null &&  val !=""){
		 	        prefix="\r\n";
		    	}
		        val+= prefix + key+"："+value;	
			}
	    	document.getElementById("viewAppDataValue").innerHTML=val; 
	    }
    }
}


//遍历房间用户列表
function participantsHandle(participants,status) {
	if(status === "leave"){
		var userList = userListUl.getElementsByTagName("li");
		for(var i = 0; i<userList.length; i++){
			if(userList[i].getAttribute("userId") == participants.id){
				userListUl.removeChild(userList[i]);
				return;
			}
		}
	}else if(status === "newJoin"){
		participants.forEach(function(user,i) {
			var listLi = document.createElement("li");
			listLi.innerHTML = user.name;
			listLi.setAttribute("userId",user.id);
			userListUl.appendChild(listLi);
		});
	}else{
		participants.forEach(function(user,i) {
			var listLi = document.createElement("li");
			listLi.innerHTML = user.name;
			listLi.setAttribute("userId",user.id);
			userListUl.appendChild(listLi);
		});
		$("#userList").children().eq(0).addClass("current");
	}
}

//离会
leaveRoomBtn.onclick = function() {
	room.leave(1).then(function() {
		joinRoomSuccess = false;
		location.reload();
	});
}

//获取访问URL的参数
function GetQueryString(name) {
	var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
	var r = window.location.search.substr(1).match(reg);
	if(r != null) {
		return unescape(r[2]);
	}
	return null;
}

//统一日志显示，在页面最下方显示步骤进度
function showResult(content, color) {
	var myDate = new Date();
	var currentTime = changeTimeFromat(myDate.getHours()) + ":" + changeTimeFromat(myDate.getMinutes()) + ":" + changeTimeFromat(myDate.getSeconds());
	var showContent = currentTime + " " + content;
	showContent = "<span style='color:" + color + "'>" + showContent + "</span>";
	$("#logShow").html($("#logShow").html() + showContent + "<br>");
	$("#jp-container").scrollTop($('#jp-container')[0].scrollHeight);
}

function changeTimeFromat(time) {
	if(time < 10) {
		return "0" + time;
	}
	return time;
}
/**
 * 字符串相关处理
 */
var strUtil = {
    /*
     * 判断字符串是否为空
     * @param str 传入的字符串
     * @returns {}
     */
    isEmpty:function(str){
        if(str != null && str.length > 0){
            return false;
        }else{
            return true;
        }
    }
}


/**
 * 返回当前用户所显示的格式的当前时间
 * @returns {string}
 */
function getCurrentTime(stamp) {
    var now     = (stamp? new Date(stamp): new Date());
    var hour    = now.getHours();
    var minute  = now.getMinutes();
    var second  = now.getSeconds();
    if(hour.toString().length === 1) {
        hour = '0'+hour;
    }
    if(minute.toString().length === 1) {
        minute = '0'+minute;
    }
    if(second.toString().length === 1) {
        second = '0'+second;
    }
    return hour+':'+minute+':'+second;
}
//错误统一处理
function showError(error) {
	showResult("code:" + error.code + " ;  message:" + error.message, 'red');
}

//添加左侧列表事件监听
$("#userList").on("click","li",function(){
	$(this).addClass("current").siblings().removeClass("current");
})
