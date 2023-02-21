/*
*@autor: Rio 3D Studios
*@description:  java script server that works as master server of the Basic Example of WebGL Multiplayer Kit
*/
var express = require('express');//import express NodeJS framework module
var app = express();// create an object of the express module
var http = require('http').Server(app);// create a http web server using the http library
var io = require('socket.io')(http);// import socketio communication module


app.use("/public/TemplateData", express.static(__dirname + "/public/TemplateData"));
app.use("/public/Build", express.static(__dirname + "/public/Build"));
app.use(express.static(__dirname + '/public'));

var clients = [];// to storage clients
var clientLookup = {};// clients search engine
var sockets = {};//// to storage sockets

var con;//database connection

var isLocalTest = false;

//open a connection with the specific client
io.on('connection', function (socket) {

	//print a log in node.js command prompt
	console.log('A user ready for connection!');

	//to store current client connection
	var currentUser;

	var sended = false;

	var isLocalTest = true;


	//create a callback fuction to listening EmitPing() method in NetworkMannager.cs unity script
	socket.on('PING', function (_pack) {
		//console.log('_pack# '+_pack);
		var pack = JSON.parse(_pack);

		console.log('message from user# ' + socket.id + ": " + pack.msg);

		//emit back to NetworkManager in Unity by client.js script
		socket.emit('PONG', socket.id, pack.msg);

	});

	//create a callback fuction to listening EmitJoin() method in NetworkMannager.cs unity script
	//socket.on('LOGIN', function (_data)
	socket.on('LOGIN', function (_data) {

		console.log('[INFO] JOIN received !!! ');

		var data = JSON.parse(_data);

		var id = -1;
		var user;
		var password;
		var coins;
		var logged;

		con.query("select * from users where mail = '" + data.user + "' and password = '" + data.password + "'", function (err, result) {
			if (err)
				throw err;

			if (result.length > 0) {
				console.log('[INFO] Player data founded !!! ');

				for (const val of result) {
					id = val.id;
					user = val.mail;
					password = val.password;
					coins = val.coins;
					logged = val.logged;
				}


				if (logged == 0 || logged == '0') {
					con.query("update users set logged = '1' where mail = '" + data.user + "' and password = '" + data.password + "'", function (err, result) {
						if (err)
							throw err;

						if (result) {
							currentUser =
							{
								user: user,
								password: password,
								position: data.position,
								rotation: '0',
								id: socket.id,//alternatively we could use socket.id
								socketID: socket.id,//fills out with the id of the socket that was open
								isMute: false,
								coins: coins,
								available: false,
								opponentID: '',
								selectedOption: '',
								currentBet: ''
							};//new user  in clients list

							console.log('[INFO] player ' + currentUser.user + ': logged!');
							console.log('[INFO] currentUser.position ' + currentUser.position);

							//add currentUser in clients list
							clients.push(currentUser);

							//add client in search engine
							clientLookup[currentUser.id] = currentUser;

							sockets[currentUser.id] = socket;//add curent user socket

							console.log('[INFO] Total players: ' + clients.length);

							/*********************************************************************************************/

							//send to the client.js script
							socket.emit("LOGIN_SUCCESS", currentUser.id, currentUser.user, currentUser.coins, currentUser.password);

							//spawn all connected clients for currentUser client 
							clients.forEach(function (i) {
								if (i.id != currentUser.id) {
									//send to the client.js script
									socket.emit('SPAWN_PLAYER', i.id, i.user,i.currentBet);

								}//END_IF

							});//end_forEach

							// spawn currentUser client on clients in broadcast
							socket.broadcast.emit('SPAWN_PLAYER', currentUser.id, currentUser.user, currentUser.currentBet);
						}
					});
				}
				else {
					console.log('[WARNING] player ' + data.user + ':' + data.password + ' already logged!');
					//send to the client.js script
					socket.emit("LOGIN_FAILURE", socket.id, data.user);
				}
			}
			else {
				console.log('[WARNING] player ' + data.user + ':' + data.password + ' dont exist!');
				//send to the client.js script
				socket.emit("LOGIN_FAILURE", socket.id, data.user);
			}
		});
	});//END_SOCKET_ON

	//Less money
	socket.on('LESSMONEY', function (_data) {
		console.log('[INFO] LESSMONEY received !!! ');

		var data = JSON.parse(_data);

		var ammount = parseFloat(data.ammount);

		con.query("select * from users where mail = '" + data.user + "' and password = '" + data.password + "'", function (err, result) {
			if (err)
				throw err;

			if (result.length > 0) {
				console.log('[INFO] Player data founded !!! ');

				for (const val of result) {
					var coins = parseFloat(val.coins);

					var newCoinsAmmount = coins - ammount;

					if (newCoinsAmmount < 0) {
						newCoinsAmmount = 0;
					}


					con.query("update users set coins = '" + newCoinsAmmount + "' where mail = '" + data.user + "' and password = '" + data.password + "'", function (err, result) {
						if (err)
							throw err;

						if (result) {
							//Send the new coins ammount to the client

							socket.emit("MONEY_UPDATED", socket.id, newCoinsAmmount);
							console.log('[INFO] MONEY UPDATED !!! ');
						}
						else {
							socket.emit("MONEY_UPDATE_FAILURE", socket.id);
							console.log('[WARNING] MONEY NOT UPDATED !!! ');
						}
					});
				}
			}
			else {
				//Error trying to change the money ammount

				socket.emit("MONEY_UPDATE_FAILURE", socket.id);
				console.log('[WARNING] MONEY NOT UPDATED !!! ');
			}
		});

	});

	//Gain money
	socket.on('GAINMONEY', function (_data) {
		console.log('[INFO] GAINMONEY received !!! ');

		var data = JSON.parse(_data);

		var ammount = parseFloat(data.ammount);

		con.query("select * from users where mail = '" + data.user + "' and password = '" + data.password + "'", function (err, result) {
			if (err)
				throw err;

			if (result.length > 0) {
				console.log('[INFO] Player data founded !!! ');

				for (const val of result) {
					var coins = parseFloat(val.coins);

					var newCoinsAmmount = coins + ammount;

					if (newCoinsAmmount < 0) {
						newCoinsAmmount = 0;
					}


					con.query("update users set coins = '" + newCoinsAmmount + "' where mail = '" + data.user + "' and password = '" + data.password + "'", function (err, result) {
						if (err)
							throw err;

						if (result) {
							//Send the new coins ammount to the client

							socket.emit("MONEY_UPDATED", socket.id, newCoinsAmmount);
							console.log('[INFO] MONEY UPDATED !!! ');
						}
						else {
							socket.emit("MONEY_UPDATE_FAILURE", socket.id);
							console.log('[WARNING] MONEY NOT UPDATED !!! ');
						}
					});
				}
			}
			else {
				//Error trying to change the money ammount

				socket.emit("MONEY_UPDATE_FAILURE", socket.id);
				console.log('[WARNING] MONEY NOT UPDATED !!! ');
			}
		});

	});

	//Find opponent
	socket.on('FINDOPPONENT', function (_data) {
		console.log('[INFO] FINDOPPONENT received !!! ');

		var data = JSON.parse(_data);
		var currentUserBetAmount;

		var opponent = null;

		for (var i = 0; i < clients.length; i++) {
			if (clients[i].user == data.user) {
				console.log('[INFO] UPDATING USER ' + data.user);
				clients[i]["available"] = true;
				clients[i]["opponentID"] = '';
				currentUserBetAmount = clients[i].currentBet;
				break;
			}
		}

		for (var i = 0; i < clients.length; i++) {
			//console.log('[INFO] FINDING OPPONENT ' + clients[i].user + ' is available ' + clients[i].available);

			if (clients[i].user != data.user) {
				if (clients[i].available == true && clients[i].opponentID == '' && clients[i].currentBet == currentUserBetAmount) {
					console.log('[INFO] FOUNDED OPPONENT ' + data.user + ' vs ' + clients[i].user);
					opponent = clients[i];

					break;
				}
			}
		}

		if (opponent != null) {
			for (var i = 0; i < clients.length; i++) {
				if (clients[i].user == data.user) {
					clients[i]["opponentID"] = opponent.id;
				}

				if (clients[i].user == opponent.user) {
					clients[i]["opponentID"] = data.id;
				}
			}



			socket.emit("FOUNDED_OPPONENT", data.id, opponent.id, opponent.user);
			sockets[opponent.id].emit("FOUNDED_OPPONENT", opponent.id, data.id, data.user);
		}

	});

	//Cancel Find opponent
	socket.on('CANCELFINDOPPONENT', function (_data) {

		console.log('[INFO] FINDOPPONENT received !!! ');

		var data = JSON.parse(_data);

		for (var i = 0; i < clients.length; i++) {
			if (clients[i].user == data.user) {
				console.log('[INFO] UPDATING USER ' + data.user);
				clients[i]["available"] = false;
				clients[i]["opponentID"] = '';
				break;
			}
		}

		socket.emit("CANCEL_FIND_OPPONENT");

	});

	//Set selected option
	socket.on('SETSELECTEDOPTION', function (_data) {

		console.log('[INFO] SETSELECTEDOPTION received !!! ');

		var data = JSON.parse(_data);

		var gameFinished = false;
		var opponent;
		var betAmount = 5;


		for (var i = 0; i < clients.length; i++) {
			if (clients[i].user == data.user) {
				console.log('[INFO] UPDATING USER ' + data.user);
				clients[i]["selectedOption"] = data.option;
				betAmount = clients[i].currentBet;
			}

			if (clients[i].id == data.opponentId) {
				if (clients[i]["selectedOption"] != '') {
					gameFinished = true;
					opponent = clients[i];
				}
			}
		}

		if (gameFinished) {
			if (data.option == 0 && opponent.selectedOption == 0) {
				//None

				console.log('[INFO] Result ' + data.user + ' VS ' + opponent.user + ' = ' + 'None');
			}

			if (data.option == 0 && opponent.selectedOption == 1) {
				//Loss

				console.log('[INFO] Result ' + data.user + ' VS ' + opponent.user + ' = ' + data.user + ' Loss');
				console.log('[INFO] Result ' + data.user + ' VS ' + opponent.user + ' = ' + opponent.user + ' Win');

				socket.emit("FORCE_LESS_MONEY", parseFloat(betAmount));
				sockets[data.opponentId].emit("FORCE_GAIN_MONEY", (parseFloat(betAmount) - (parseFloat(betAmount) * 0.1)));
			}

			if (data.option == 0 && opponent.selectedOption == 2) {
				//Win

				console.log('[INFO] Result ' + data.user + ' VS ' + opponent.user + ' = ' + data.user + ' Win');
				console.log('[INFO] Result ' + data.user + ' VS ' + opponent.user + ' = ' + opponent.user + ' Loss');

				socket.emit("FORCE_GAIN_MONEY", (parseFloat(betAmount) - (parseFloat(betAmount) * 0.1)));
				sockets[data.opponentId].emit("FORCE_LESS_MONEY", parseFloat(betAmount));
			}

			if (data.option == 1 && opponent.selectedOption == 0) {
				//Win

				console.log('[INFO] Result ' + data.user + ' VS ' + opponent.user + ' = ' + data.user + ' Win');
				console.log('[INFO] Result ' + data.user + ' VS ' + opponent.user + ' = ' + opponent.user + ' Loss');

				socket.emit("FORCE_GAIN_MONEY", (parseFloat(betAmount) - (parseFloat(betAmount) * 0.1)));
				sockets[data.opponentId].emit("FORCE_LESS_MONEY", parseFloat(betAmount));
			}

			if (data.option == 1 && opponent.selectedOption == 1) {
				//None
				console.log('[INFO] Result ' + data.user + ' VS ' + opponent.user + ' = ' + 'None');
			}

			if (data.option == 1 && opponent.selectedOption == 2) {
				//Loss

				console.log('[INFO] Result ' + data.user + ' VS ' + opponent.user + ' = ' + data.user + ' Loss');
				console.log('[INFO] Result ' + data.user + ' VS ' + opponent.user + ' = ' + opponent.user + ' Win');

				socket.emit("FORCE_LESS_MONEY", parseFloat(betAmount));
				sockets[data.opponentId].emit("FORCE_GAIN_MONEY", (parseFloat(betAmount) - (parseFloat(betAmount) * 0.1)));
			}

			if (data.option == 2 && opponent.selectedOption == 0) {
				//Loss

				console.log('[INFO] Result ' + data.user + ' VS ' + opponent.user + ' = ' + data.user + ' Loss');
				console.log('[INFO] Result ' + data.user + ' VS ' + opponent.user + ' = ' + opponent.user + ' Win');

				socket.emit("FORCE_LESS_MONEY", parseFloat(betAmount));
				sockets[data.opponentId].emit("FORCE_GAIN_MONEY", (parseFloat(betAmount) - (parseFloat(betAmount) * 0.1)));
			}

			if (data.option == 2 && opponent.selectedOption == 1) {
				//Win

				console.log('[INFO] Result ' + data.user + ' VS ' + opponent.user + ' = ' + data.user + ' Win');
				console.log('[INFO] Result ' + data.user + ' VS ' + opponent.user + ' = ' + opponent.user + ' Loss');

				socket.emit("FORCE_GAIN_MONEY", (parseFloat(betAmount) - (parseFloat(betAmount) * 0.1)));
				sockets[data.opponentId].emit("FORCE_LESS_MONEY", parseFloat(betAmount));
			}

			if (data.option == 2 && opponent.selectedOption == 2) {
				//None
				console.log('[INFO] Result ' + data.user + ' VS ' + opponent.user + ' = ' + 'None');
			}


			for (var i = 0; i < clients.length; i++) {
				if (clients[i].user == data.user || clients[i].id == data.opponentId) {
					console.log('[INFO] UPDATING USER ' + data.user);
					clients[i]["selectedOption"] = '';
					clients[i]["opponentID"] = '';
					clients[i]["available"] = false;
				}
			}
		}

		socket.emit("ON_SELECTED_OPTION");
		sockets[data.opponentId].emit("UPDATE_OPPONENT_STATE", data.option);

	});

	//Set bet amount
	socket.on('SETBETAMOUNT', function (_data) {
		console.log('[INFO] SETBETAMOUNT received !!! ');

		var data = JSON.parse(_data);

		for (var i = 0; i < clients.length; i++) {
			if (clients[i].user == data.user) {

				console.log('[INFO] UPDATING USER ' + data.user);

				clients[i]["currentBet"] = data.betAmount;

				socket.broadcast.emit('UPDATE_CURRENT_BET_AMOUNT', currentUser.id, data.betAmount);
				break;
			}
		}
	});


	//Set bet amount
	socket.on('CHANGEPASSWORD', function (_data) {
		console.log('[INFO] CHANGEPASSWORD received !!! ');

		var data = JSON.parse(_data);

		for (var i = 0; i < clients.length; i++) {
			if (clients[i].user == data.user) {
				console.log('[INFO] UPDATING USER PASSWORD ' + data.user);
				clients[i]["password"] = data.newPassword;

				con.query("update users set password = '" + data.newPassword + "' where mail = '" + data.user + "' and password = '" + data.password + "'", function (err, result) {
					if (err)
						throw err;
				});


				break;
			}
		}
	});


	//create a callback fuction to listening EmitMoveAndRotate() method in NetworkMannager.cs unity script
	socket.on('MOVE_AND_ROTATE', function (_data) {
		var data = JSON.parse(_data);

		if (currentUser) {

			currentUser.position = data.position;

			currentUser.rotation = data.rotation;

			// send current user position and  rotation in broadcast to all clients in game
			socket.broadcast.emit('UPDATE_MOVE_AND_ROTATE', currentUser.id, currentUser.position, currentUser.rotation);


		}
	});//END_SOCKET_ON


	socket.on("VOICE", function (data) {


		if (currentUser) {

			var newData = data.split(",");//define a separator character
			newData[0] = "data:audio/ogg;"; //format the audio packet header
			newData = newData[0] + newData[1];//concatenate

			//go through the clients list and send audio to the current client "u" if the conditions are met
			clients.forEach(function (u) {

				if (sockets[u.id] && u.id != currentUser.id && !u.isMute) {
					sockets[u.id].emit('UPDATE_VOICE', newData);
				}
			});//END_FOREACH


		}//END_IF

	});//END_SOCKETIO


	socket.on("AUDIO_MUTE", function (data) {

		if (currentUser) {
			currentUser.isMute = !currentUser.isMute;

		}
	});


	// called when the user desconnect
	socket.on('disconnect', function () {

		if (currentUser) {
			currentUser.isDead = true;

			//send to the client.js script
			//updates the currentUser disconnection for all players in game
			socket.broadcast.emit('USER_DISCONNECTED', currentUser.id);


			for (var i = 0; i < clients.length; i++) {
				if (clients[i].user == currentUser.user && clients[i].id == currentUser.id) {

					console.log("User " + clients[i].user + " has disconnected");

					con.query("update users set logged = '0' where mail = '" + clients[i].user + "' and password = '" + clients[i].password + "'", function (err, result) {
						if (err)
							throw err;

						if (result) {

						}
					});

					clients.splice(i, 1);

				};
			};

		}

	});//END_SOCKET_ON
});//END_IO.ON


http.listen(process.env.PORT || 3000, function () {
	console.log('listening on *:3000');

	var mysql = require('mysql');

	if (isLocalTest == false) {
		con = mysql.createPool({
			connectionLimit: 10,
			host: "172.31.88.93",
			user: "juegopie_owner",
			password: "Gaby41580918Gaby",
			database: "juegopie_users"
		});
	}
	else {
		con = mysql.createPool({
			connectionLimit: 10,
			host: "localhost",
			user: "root",
			password: "",
			database: "ppotgame"
		});
	}
});

console.log("------- server is running -------");