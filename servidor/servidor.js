'use strict';
var mongoose = require('mongoose');				//lib para manejar la base de datos mongo
var models = require('./models/models.js');		//archivo js con los modelos de objetos a guardar en la BD	
var express = require('express');				//lib para manejar conexiones con los clientes
var app = express();
var bodyParser= require('body-parser');
var server = require('http').Server(app);		//servidor web
var session = require('express-session'); 		//para manejo de sesiones
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
var sess_rol;
//algunas configuraciones del servidor
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

//funcion para verificar el nivel de usuario
function nivelRequerido(rol) {     
	return function(req, res, next)
	{         
		if(req.session.role && req.session.role == rol)
		{             
			// Inicio sesion y tiene el nivel requerido
			next();
	    }else{
	        // No inicio sesion o no tiene el nivel requerido
	        res.sendStatus(403);
        }
    };
}

//funcion para verificar si el usuario tiene una sesion
function loginRequerido() {     
	return function(req, res, next)
	{         
		if(req.session.email)
		{             
			// Inicio sesion requerido
			next();
	    }else{
	        // No inicio sesion
	        res.sendStatus(403);
        }
    };
}
/*función utilizada para abrir páginas a usuarios que tengan una sesion
y si no posee una sesión se les envía la pagina de inicio*/
/*function openNewPage(getName, dirName){
	app.get(getName, function (req, res)
	{ 
		if(req.session)
		{             
			res.sendFile(__dirname + dirName);
		}else{
			res.sendFile(__dirname + '/public/index.html');
		}
	});
}

openNewPage('/','/public/home.html');
openNewPage('/home','/public/home.html');
openNewPage('/about','/public/about.html');
openNewPage('/contact','/public/contact.html');*/

app.get('/loginForm', function(req,res){
	res.sendFile(__dirname + '/public/index.html');
});

app.get('/', loginRequerido(), function(req,res){
	res.sendFile(__dirname + '/public/home.html');
});

app.get('/home', loginRequerido(), function(req,res){
	res.sendFile(__dirname + '/public/home.html');
});

app.get('/about', loginRequerido(), function(req,res){
	res.sendFile(__dirname + '/public/about.html');
});

app.get('/contact', loginRequerido(), function(req,res){
	res.sendFile(__dirname + '/publiccontact.html');
});


app.get('/doorsManagement', function (req, res)
{ 
	sess = req.session;
	console.log("this role is... "+ sess.role);
	if(sess.role == "admin") {
		res.sendFile(__dirname + '/public/doorsManagement.html');
	}else if(sess.role == "user"){
		res.sendFile(__dirname + '/public/doorsManagement2.html');
	}else{
		res.sendFile(__dirname + '/public/index.html');
	}
});

app.post('/login', function(req, res)
{
	var email = req.body.email;
	var password = req.body.password;
	sess = req.session;
	models.Users.findOne({email: email, pass:password}).exec(function(error, user)
	{
		if(user!=null){
			//Aqui asignamos el Id a la variable sess.userId
			sess.userId=user._id;
			//Aqui asignamos el email a la variable sess.email
			sess.email = email;
			//Aqui asignamos el role a la variable sess.role
			sess.role = user.role;
			//res.sendFile(__dirname + '/public/index.html');
			res.send('correcto');
			console.log("correcto");
		}else{
			res.send('incorrecto');
		}
	});
});
//obtener un role (enviar datos de sesion)
app.post('/getThisRole', function(req, res)
{
	var sess = req.session;
	res.send(sess);
});
//salir de sesion
app.get('/logout',function(req,res)
{
	req.session.destroy(function(err)
	{
	  if(err) {
	    console.log("logout err: " + err);
	  } else {
	    res.send("success");
	  }
	});
});
/*En el segundo parametro de la funcion ejecuta loginRequerido() para que
la funcion en el tercer parametro se ejecute, si el cliente tiene una sesion,
si no posee responde con error 403*/
app.post('/user', loginRequerido(), function(req, res)
{
	var name = req.body.name;
	var lastName = req.body.lastName;
	var email = req.body.email;
	var phone = req.body.phone;
	var dni = req.body.dni;
	var role = req.body.role;
	var password= req.body.password;
	var door = req.body._door;
		models.Users.create(
		{
			'name':name,
			'lastName':lastName,
			'email': email,
			'phone':phone,
			'dni':dni,
			'role': role,
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
//eliminar usuario
app.post('/deleteUser', nivelRequerido('admin'), function(req, res)
{
	var dni = req.body.dni;
	models.Users.findOneAndRemove(
		{'dni': dni }, function(err) {
  		if (err) throw err;
  		res.send('borrado'); 
	});
});
//obtener usuario pasandole el parametro de dni
app.post('/getAuser', loginRequerido(), function(req,res)
{
	var dni = req.body.dni;
	models.Users.findOne({'dni':dni}, function(error, user)
	{
		res.send(user);
		console.log("err al obtener user: " + error);
	});
});
//actualizar usuario
app.post('/updateUser', nivelRequerido('admin'), function(req,res)
{
	var name = req.body.name;
	var lastName = req.body.lastName;
	var email = req.body.email;
	var phone = req.body.phone;
	var dni = req.body.dni;
	var password= req.body.password;
	var role= req.body.role;
	var door = req.body._door;
	models.Users.findOneAndUpdate({'dni': dni},{
		'name':name,
		'lastName':lastName,
		'email':email,
		'phone': phone, 
		'dni':dni, 
		'pass':password,
		'role':role,
		'_door':door	
	}, function(error, updatedUser)
	{
		console.log('error: '+ error);
		console.log('updatedUser: '+ updatedUser);
		if(error != null)
			res.send('correcto');
		else
			res.send('error al actualizar usuario');
	});
});
//crear una localidad
app.post('/createLocation', nivelRequerido('admin'), function(req,res){
	var name= req.body.name;
	console.log("name: "+name);
	models.Locations.create(
		{
			'name': name
		}, function(error, locationcreated)
		{
			res.send('location created');
		}
	);
});
//obtener localidades
app.post('/getLocations', loginRequerido(), function(req,res)
{
	var name = req.body.name;
	models.Locations.find({}, function(error, locations)
	{
		res.send(locations);
	});
});

//crear puerta
app.post('/createDoor', nivelRequerido('admin'), function(req, res)
{
	var name = req.body.name;
	var _id = req.body._id;
	var _location = req.body._location;
	models.Doors.create(
		{
			'name':name,
			'_id':_id,
			'_location': _location
		}, function(error, doorcreado)
		{
			res.send('creado');
		}
	);
});

//listar puertas
app.post('/getDoors', loginRequerido(), function(req, res)
{
	models.Doors.find({}, function(error, doors)
	{
		res.send(doors);
	});
});
//eliminar puerta
app.post('/deleteDoor', nivelRequerido('admin'), function(req, res)
{
	var id = req.body._id;
	models.Doors.findOneAndRemove(
		{'_id': id }, function(err) {
  		if (err) throw err;
  		res.send('borrado');
	});
});

//crear eventos
app.get('/createEvent', nivelRequerido('admin'), function(req, res)
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
//obtener roles
app.post('/getRoles', loginRequerido(), function(req, res)
{
	models.Roles.find().exec(function(error, roles)
	{
		res.send(roles);
	});
});
//mostrar la lista de accesos por usuario
app.post('/showDoorAccess', loginRequerido(), function(req, res)
{
	var id = req.body.doorID;
	models.Events.find({_door:id}).populate('_user _door').exec(function(error, eventos)
	{
		res.send(eventos);
		console.log("eventos: "+eventos);
	});
});

//obtener usuarios 
app.post('/getUsers', loginRequerido(), function(req,res) {     
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
		//console.log(users);
	}); 
});
//abrir puerta
app.post('/openDoor', loginRequerido(), function(req, res)
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
				'_user': req.session.userId,
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
				'_user': req.session.userId,
				'_door': idDoor,
				'description': 'no se abrio',
				'date': new Date(),
				'action':'entrar'
			});
		}
	});
});
//enviar comando abrir al nodo
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
								//if(sess.userId == client.id)
									io.emit('news', {id: client.id, msj:'Se abrió la puerta'});
								  
								//Se crea un registro de evento en la BD 
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
								io.emit('news', {id: client.id, msj:'No se abrió la puerta'});
								//Se crea un registro de evento en la BD 
								models.Events.create(
								{
									'_user': user._id,
									'_door': client.id,
									'description': 'no se abrio la puerta',
									'date': new Date(),
									'action':'atenticacion incorrecta'
								});
							}
							//Se envía el mensaje de exito o error resultante al nodo
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
	/*si el paquete que llega del nodo tiene notif en el atributo descriptor, enviar la id
	  del cliente a la aplicación web*/
	if(obj.descriptor == "notif")
	{
		io.emit("news", {client: client.id});
	}
	/*si el paquete que llega del nodo tiene doorState en el atributo descriptor, enviar la id
	  del cliente y el estado (abierto o cerrado) a la aplicación web*/
	if(obj.descriptor == "doorState"){
		io.emit("doorstate", {client: client.id, state: obj.state});
	}
});