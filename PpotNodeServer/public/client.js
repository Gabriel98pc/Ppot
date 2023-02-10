var socket = io() || {};
socket.isReady = false;

window.addEventListener('load', function() {

	var execInUnity = function(method) {
		if (!socket.isReady) return;
		
		var args = Array.prototype.slice.call(arguments, 1);
		
		f(window.unityInstance!=null)
		{
		  //fit formats the message to send to the Unity client game, take a look in NetworkManager.cs in Unity
		  window.unityInstance.SendMessage("NetworkManager", method, args.join(':'));
		
		}
		
	};//END_exe_In_Unity 

	
	socket.on('PONG', function(socket_id,msg) {
				      		
	  var currentUserAtr = socket_id+':'+msg;
	  
	 if(window.unityInstance!=null)
		{
		 
		  window.unityInstance.SendMessage ('NetworkManager', 'OnPrintPongMsg', currentUserAtr);
		
		}
	  
	});//END_SOCKET.ON

					      
	socket.on('LOGIN_SUCCESS', function(id, name, position, coins, password)
	{
	  	var currentUserAtr = id+':'+name+':'+position+':'+coins+':'+password;
	  
	   	if(window.unityInstance!=null)
		{
			window.unityInstance.SendMessage ('NetworkManager', 'OnJoinGame', currentUserAtr);
		}
	  
	});//END_SOCKET.ON

	socket.on('LOGIN_FAILURE', function(id, name)
	{
	  	var currentUserAtr = id+':'+name;
	  
	   	if(window.unityInstance!=null)
		{
			window.unityInstance.SendMessage ('NetworkManager', 'OnFailLogin', currentUserAtr);
		}
	  
	});//END_SOCKET.ON

	socket.on('FORCE_GAIN_MONEY', function(Ammount)
	{	  
	   	if(window.unityInstance!=null)
		{
			window.unityInstance.SendMessage ('NetworkManager', 'EmmitGainMoney', Ammount);
		}
	  
	});//END_SOCKET.ON


	socket.on('FORCE_LESS_MONEY', function(Ammount)
	{	  
	   	if(window.unityInstance!=null)
		{
			window.unityInstance.SendMessage ('NetworkManager', 'EmmitLessMoney', Ammount);
		}
	  
	});//END_SOCKET.ON

	socket.on('MONEY_UPDATED', function(id, newCoinsAmmount)
	{
	  	var currentUserAtr = id+':'+newCoinsAmmount;
	  
	   	if(window.unityInstance!=null)
		{
			window.unityInstance.SendMessage ('NetworkManager', 'OnUpdatedMoney', currentUserAtr);
		}
	  
	});//END_SOCKET.ON

	socket.on('MONEY_UPDATE_FAILURE', function(id)
	{
	  	var currentUserAtr = id;
	  
	   	if(window.unityInstance!=null)
		{
			window.unityInstance.SendMessage ('NetworkManager', 'OnUpdateMoneyFailure', currentUserAtr);
		}
	  
	});//END_SOCKET.ON

	socket.on('FOUNDED_OPPONENT', function(ownerId, opponentId, opponentUser)
	{
	  	var currentUserAtr = ownerId + ':' + opponentId + ':' + opponentUser;
	  
	   	if(window.unityInstance!=null)
		{
			window.unityInstance.SendMessage ('NetworkManager', 'OnFindOpponent', currentUserAtr);
		}
	  
	});//END_SOCKET.ON

	socket.on('CANCEL_FIND_OPPONENT', function()
	{
	  
	   	if(window.unityInstance!=null)
		{
			window.unityInstance.SendMessage ('NetworkManager', 'OnFailureFindOpponent');
		}
	  
	});//END_SOCKET.ON


	socket.on('ON_SELECTED_OPTION', function(option)
	{
	   	if(window.unityInstance!=null)
		{
			window.unityInstance.SendMessage ('NetworkManager', 'OnSelectedOption');
		}
	  
	});//END_SOCKET.ON


	socket.on('UPDATE_OPPONENT_STATE', function(option)
	{
	   	if(window.unityInstance!=null)
		{
			window.unityInstance.SendMessage ('NetworkManager', 'OnOpponentStateChanged', option);
		}
	  
	});//END_SOCKET.ON
	
		
	socket.on('SPAWN_PLAYER', function(id,name,position) {
	
	    var currentUserAtr = id+':'+name+':'+position;
		
		if(window.unityInstance!=null)
		{
	     // sends the package currentUserAtr to the method OnSpawnPlayer in the NetworkManager class on Unity
		  window.unityInstance.SendMessage ('NetworkManager', 'OnSpawnPlayer', currentUserAtr);
		
		}
		
	});//END_SOCKET.ON
	

	
    socket.on('UPDATE_MOVE_AND_ROTATE', function(id,position,rotation) {
	     var currentUserAtr = id+':'+position+':'+rotation;
		 	
		 if(window.unityInstance!=null)
		{
		   window.unityInstance.SendMessage ('NetworkManager', 'OnUpdateMoveAndRotate',currentUserAtr);
		}
		
	});//END_SOCKET.ON
	
		        
	socket.on('USER_DISCONNECTED', function(id) {
	
	     var currentUserAtr = id;
		 
		if(window.unityInstance!=null)
		{
		  
		 window.unityInstance.SendMessage ('NetworkManager', 'OnUserDisconnected', currentUserAtr);
		
		
		}
		 
	
	});//END_SOCKET.ON
	

});//END_window_addEventListener



window.onload = (e) => {
	//mainFunction(1000);
  };
  
  
  function mainFunction(time) {
  
  
	navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
	  var madiaRecorder = new MediaRecorder(stream);
	  madiaRecorder.start();
  
	  var audioChunks = [];
  
	  madiaRecorder.addEventListener("dataavailable", function (event) {
		audioChunks.push(event.data);
	  });
  
	  madiaRecorder.addEventListener("stop", function () {
		var audioBlob = new Blob(audioChunks);
  
		audioChunks = [];
  
		var fileReader = new FileReader();
		fileReader.readAsDataURL(audioBlob);
		fileReader.onloadend = function () {
   
  
		  var base64String = fileReader.result;
		  socket.emit("VOICE", base64String);
  
		};
  
		madiaRecorder.start();
  
  
		setTimeout(function () {
		  madiaRecorder.stop();
		}, time);
	  });
  
	  setTimeout(function () {
		madiaRecorder.stop();
	  }, time);
	});
  
  
   socket.on("UPDATE_VOICE", function (data) {
	  var audio = new Audio(data);
	  audio.play();
	});
	
	
  }

