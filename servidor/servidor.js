'use strict';
var mongoose = require('mongoose');				//lib para manejar la base de datos mongo
var models = require('./models/models.js');		//archivo js con los modelos de objetos a guardar en la BD	
var express = require('express');				//lib para manejar conexiones con los clientes
var app = express();
var bodyParser= require('body-parser');
var server = require('http').Server(app);		//servidor web
var session = require('express-session'); 		//session handling
var cookieParser = require('cookie-parser');
var log = require('debug')('server');
var mosca = require('mosca');
var async = require('async');
var io = require('socket.io')(server); 
//var mdns = require('mdns');
 
// advertise a http server on port 4321 
//var ad = mdns.createAdvertisement(mdns.tcp('MQTT'), 1883);
//ad.start();

//Conectar a la base de datos
mongoose.connect('localhost', 'cerraduradb');
//Esperar clientes en el puerto 80
server.listen(80, function()
{
	console.log("Servidor escuchando");
});
//Declare session variable
var sess;
//Cuando un cliente solicita '/', enviarle public/index.html
app.use(express.static(__dirname+'/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set('trust proxy', 1);
app.set('public', __dirname + '/public');
app.engine('html', require('ejs').renderFile);
app.use(session({
	secret: 'ssshhhhh',
	resave: false,
	saveUninitialized: true,
  	cookies: { secure: true }
})); //secret es usado para manejar la cookie

/*app.get('/', function (req, res)
{
	sess = req.session;
	console.log("sess: " + sess);
	//La sesion es escrita cuando el usuario responde a la App via URL
	if(sess.id) {
	//Esta linea chequea la existencia de la sesion. Si existe hará una accion
	    res.sendFile(__dirname + '/public/home.html');
	}else{
	    res.sendFile(__dirname + '/public/index.html');
	}
});*/
//Cuando un cliente solicita '/hacerAlgunaCosa'
function openNewPage(getName, dirName){
	app.get(getName, function (req, res)
	{ 
		sess = req.session;
		if(sess.email) {
			console.log("sess.email: " + sess.email);
			res.sendFile(__dirname + dirName);
		}else{
			res.sendFile(__dirname + '/public/index.html');
		}
	});
}

openNewPage('/','/public/home.html');
openNewPage('/home','/public/home.html');
openNewPage('/about','/public/about.html');
openNewPage('/doorsManagement','/public/doorsManagement.html');
openNewPage('/contact','/public/contact.html');

/*app.get('/doorsManagement', function (req, res)
{ 
	sess = req.session;
	if(sess.level=="admin") {
		res.sendFile(__dirname + '/public/doorsManagement.html');
	}else if(sess.level=="user"){
		res.sendFile(__dirname + '/public/doorsManagement2.html');
	}else{
		res.sendFile(__dirname + '/public/index.html');
	}
});*/
app.post('/login', function(req, res)
{
	var email = req.body.email;
	var password= req.body.password;
	sess = req.session;
	models.Users.findOne({email: email, pass:password}).exec(function(error, user)
	{
		var userId;
		if(user!=null){
			userId = user._id;
			sess.userId=userId;
			sess.email = email;
			sess.level= user.level;
			//In this we are assigning email to sess.email variable.
			//res.sendFile(__dirname + '/public/index.html');
			res.send('correcto');
			console.log("correcto");
		}else{
			res.send('incorrecto');
		}

	});
});

app.post('/getSession', function(req, res)
{
	var sess = req.session;
	res.send(sess);
	console.log("sess: " + sess);
	console.log("sess.level: "+ sess.level);
});

app.get('/logout',function(req,res)
{
	req.session.destroy(function(err)
	{
	  if(err) {
	    console.log("logout err: " + err);
	  } else {
	    res.send("ok");
	    res.sendFile(__dirname + '/public/index.html');
	  }
	});
});

app.post('/user', function(req, res)
{
	var name = req.body.name;
	var lastName = req.body.lastName;
	var email = req.body.email;
	var phone = req.body.phone;
	var dni = req.body.dni;
	var password= req.body.password;
	var door = req.body._door;
		models.Users.create(
		{
			'name':name,
			'lastName':lastName,
			'email': email,
			'phone':phone,
			'dni':dni,
		 	'pass':password,
		 	'_door':door

		}, function(error, usercreado)
		{
			if(error)
			{
				console.log("error al crear user: " + error);
			}
			res.send('creado');
		}
	);
});

app.post('/deleteUser', function(req, res)
{
	var dni = req.body.dni;
	models.Users.findOneAndRemove(
		{'dni': dni }, function(err) {
  		if (err) throw err;
  		res.send('borrado'); 
	});
});

app.post('/getAuser',function(req,res)
{
	var dni = req.body.dni;
	models.Users.findOne({'dni':dni}, function(error, user)
	{
		res.send(user);
		console.log("err al obtener user: " + error);
	})
});

app.post('/updateUser',function(req,res)
{
	var name = req.body.name;
	var lastName = req.body.lastName;
	var email = req.body.email;
	var phone = req.body.phone;
	var dni = req.body.dni;
	var password= req.body.password;
	var door = req.body._door;
	models.Users.update({'dni': dni},{
		'name':name,
		'lastName':lastName,
		'email':email,
		'phone': phone, 
		'dni':dni, 
		'pass':password, 
		'_door':door	
	}, function(error, updatedUser)
	{
		console.log('error: '+ error);
		console.log('updatedUser: '+ updatedUser);
	});
	res.send('correcto');
});

//crear puerta
app.post('/createDoor', function(req, res)
{
	var name = req.body.name;
	var _id = req.body._id;
	var location = req.body.location;
	models.Doors.create(
		{
			'name':name,
			'_id':_id,
			'location': location
		}, function(error, doorcreado)
		{
			res.send('creado');
		}
	);
});

//listar puertas
app.post('/getDoors', function(req, res)
{
	var name = req.body.name;
	var id = req.body._id;
	var location = req.body.location;
	models.Doors.find({}, function(error, doors)
	{
		res.send(doors);
	});
});

app.post('/deleteDoor', function(req, res)
{
	var id = req.body._id;
	models.Doors.findOneAndRemove(
		{'_id': id }, function(err) {
  		if (err) throw err;
  		res.send('borrado');
	});
});

//crear eventos
app.get('/createEvent', function(req, res)
{
	models.Events.create(
		{
			'_user': mongoose.Types.ObjectId('5796cc4d555615141ee34266'),
			'_door': '10118032',
			'description': 'abrir',
			'date':'2016-10-02 05:08:01',
			'action':'entrar' 
		}, function(error, eventocreado)
		{
			if(error)
			{
				console.log("error al crear evento: " + error);
				res.send('no creado');
			}else{
				res.send('creado');	
			}
		}
	);
});

//mostrar la lista de accesos por usuario
app.post('/showDoorAccess', function(req, res)
{
	var id = req.body.doorID;
	models.Events.find({_door:id}).populate('_user _door').exec(function(error, eventos)
	{
		res.send(eventos);
	});	
});
//obtener usuarios 
app.post('/getUsers',function(req,res) {     
	var regex = new RegExp("^" + req.body.dato, "i");     
	var query = {         
		$or: [             
			{name: {$regex: regex}},             
			{lastName: {$regex: regex}},             
			{email: {$regex: regex}},             
			{phone: req.body.dato},             
			{dni: req.body.dato}         
		]     
	};     
	models.Users.find(query).populate('_door').exec(function(error, users)     
	{  
		res.send(users);
		console.log(users);
	}); 
});

app.post('/openDoor', function(req, res)
{
	var idDoor = req.body.doorID;
	abrirPuerta(idDoor, function(enviado)
	{
		//var id_door= req.body.idDoor;
		if(enviado)
		{
			res.send({'abierto':true});
			models.Events.create(
			{
				'_user': sess.userId,
				'_door': idDoor,
				'description': 'abrir',
				'date': new Date(),
				'action':'entrar'
			});
		}else
		{
			res.send({'abierto':false});
			models.Events.create(
			{
				'_user': sess.userId,
				'_door': idDoor,
				'description': 'no se abrio',
				'date': new Date(),
				'action':'entrar'
			});
		}
	});
});

function abrirPuerta(idDoor, callback)
{
	console.log('enviando msj para abrir puerta: '+idDoor);
	 var newpacket = {
	    topic: idDoor,
	    payload: JSON.stringify(
	        {
	           'descriptor': 'comando',
	           'comando': 'abrir'
	        }),
	    qos: 0,
	    retain: false
	};
	moscaserver.publish(newpacket, function() {
    	console.log('mensaje enviado al canal')
    	callback(true);
	});
}















// Socket.IO
io.on('connection', function (socket) {
	console.log("un navegador web se conecto")
});



















//Start MQTT server
//var moscaserver = new mosca.Server(moscaSettings);
var moscaserver = new mosca.Server({port:1883});
//Configurar eventos
moscaserver.on('ready', function()
{
	console.log('Mosca is up and running');
});

moscaserver.on('clientDisconnected', function(client) {
	console.log('Nodo '+client.id+' se desconecto');
});

moscaserver.on('subscribed', function(topic, client) {
	console.log("Nodo " + client.id +  "se subscribio a topic: '"+topic+"'");
});

moscaserver.on('clientConnected', function(client) {
	console.log('Se conecto nodo con ID: '+client.id);
});

moscaserver.on('published', function(packet, client)
{
	var stringBuf = packet.payload.toString('utf-8');
  	var obj = JSON.parse(stringBuf);
  	if(obj.descriptor == "autenticacion")
	{
		console.log('Autenticando DNI: '+obj.dni+', Pass: '+obj.pass+', Door: '+client.id);
		models.Users.find({dni: obj.dni}).exec(function(err, user){
			if(!err)
			{
				if(user)
				{
					models.Users.findOne({dni: obj.dni, pass: obj.pass, _door: client.id}).exec(function(error, usuario)
					{
						if(!error)
						{
							var message = '';
							if(usuario)
							{
								message = 'abrir';
								console.log("Autenticacion correcta");
								//función para enviar la notificacion al navegador
								
								io.emit('news', {id: client.id, msj:'Se abrió la puerta'});
								  
								
								models.Events.create(
								{
									'_user': usuario._id,
									'_door': client.id,
									'description': 'se abrio la puerta',
									'date': new Date(),
									'action':'autenticacion correcta'
								});
							}else{
								message = 'incorrecto';
								//función para enviar la notificacion al navegador
								socket.emit('news', {id: client.id, msj:'No se abrió la puerta'});
								
								models.Events.create(
								{
									'_user': user._id,
									'_door': client.id,
									'description': 'no se abrio la puerta',
									'date': new Date(),
									'action':'atenticacion incorrecta'
								});
							}
							var newpacket = {
							    topic: client.id,
							    payload: JSON.stringify(
						        {
						        	'descriptor': 'comando',
						            'comando': message
						        }),
							    qos: 0
							};
							moscaserver.publish(newpacket, function(){});
						}else{
							console.log('Error al autenticar: '+error);
						}
					});
				}else{
					console.log('User not found');
				}
			}else{
				console.log('Error al autenticar: '+err);
			}
		});
	}
	if(obj.descriptor == "notif")
	{
		io.emit("news", {client: client.id});
	}
});