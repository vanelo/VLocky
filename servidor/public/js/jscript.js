$(document).ready(function()
{
	getDoors();
	/////script para obtener datos de socket.io
	var socket = io.connect('http://localhost');
	socket.on('connection', function()
	{
		console.log('connected');
	})
	socket.on('news', function (data)
	{
		console.log(data);
		alert("Se abrió la puerta");
	});
});
function login()
{ 
    var datos = {
    	'email': $('#email').val(),
    	'password': $('#password').val()
    };
    console.log(datos);
    $.post("/login", datos,  function(data, status){
        console.log(data);
        if(data =='incorrecto'){
        	alert("verifique los datos e intente de nuevo!");
        	console.log("datos de login incorrecto");
        }else{
        	console.log("datos de login correcto");
        	location.href="http://localhost/home";
        }
    });
}
function logout(){
	$.get("/logout", function(salir, status){
		if(status=="success"){
			console.log(status);
			console.log("ha salido de su session");
			location.href="http://localhost/";
		}else{
			alert("error al salir de session!");
		}
	});
}

function userForm(){
	$("#addUser").show();
	$("#btNewUser").css("display","block");
}

function doorForm(){
	$("#formDoor").show();
}

function cerrar(){
	$("#addUser").hide();
	$("#formDoor").hide();
}

function newUser(){
	var datos = {
		'name': $('#uName').val(),
		'lastName': $('#uLastname').val(),
    	'email': $('#uEmail').val(),
    	'phone':$('#uPhone').val(),
		'dni':$('#uDni').val(),
    	'password': $('#uPassword').val(),
    	'_door': $('#uDoor').val()
    };
    $.post("/user", datos, function(data, status){
        console.log(data);
        if(data == 'creado'){
        	alert("Guardado!");
        }
    });
}

function deleteUser(userDni){
	var datos = {
		'dni': userDni
    };
    $.post("/deleteUser", datos, function(data, status){ 
        console.log(data);
    	alert("Borrado!");    
    });
}
/*************************************************************************/
function getSession(){
	var level;
	$.post("/getSession", function(sess){
		level = sess.level;
		console.log("level: "+ level);
		return level;
	});
	console.log("level1: "+ level);
}

function newDoor(){
	var datos = {
		'name': $('#doorName').val(),
		'_id': $('#doorId').val(),
    	'location': $('#doorLocation').val()
    };
    $.post("/createDoor", datos, function(data, status){
        console.log(data);
        if(data == 'creado'){
        	alert("Guardado!");	
        } 
    });
    getDoors();
}

function getDoors()
{
	var options = '';
	var doorsList = '';
	var level = getSession();
	console.log("level inside getDoors: "+ level);
	$.post("/getDoors",function(doors)
	{
		var doorsOptions = {};
		for(var i=0; i<doors.length; i++)
		{
			if(!doorsOptions[doors[i].location])
			{
				doorsOptions[doors[i].location] = [];
			}
			doorsOptions[doors[i].location].push({
				name: doors[i].name,
				_id: doors[i]._id
			});
		}
		//para el select y el listado de puertas
		for(var location in doorsOptions)
		{
			options += '<optgroup label="'+location+'">';
			doorsList +='<li><p class="listTitle">'+location+'</p><ul>';
			for(var i=0; i<doorsOptions[location].length; i++)
			{
				if(level=="admin"){
					options += '<option value="'+doorsOptions[location][i]._id+'">'+doorsOptions[location][i].name+'</option>';				
					doorsList +='<li  class="addElement"><span title="ABRIR" onclick="abrirPuerta('+doorsOptions[location][i]._id+')"><i class="fa fa-sign-in" aria-hidden="true" style="cursor:pointer;"></i> </span><span title="ELIMINAR" onclick="doorDel('+doorsOptions[location][i]._id+')"><i class="fa fa-times" aria-hidden="true" style="cursor:pointer;"></i> </span><span onclick="getAccess('+doorsOptions[location][i]._id+')" title="'+doorsOptions[location][i]._id+'" style="cursor:pointer;">'+doorsOptions[location][i].name+'</span></li>';
				}	else if(level=="user"){
					options += '<option value="'+doorsOptions[location][i]._id+'">'+doorsOptions[location][i].name+'</option>';				
					doorsList +='<li  class="addElement"><span title="ABRIR" onclick="abrirPuerta('+doorsOptions[location][i]._id+')"><i class="fa fa-sign-in" aria-hidden="true" style="cursor:pointer;"></i> </span><i class="fa fa-times" aria-hidden="true" style="cursor:pointer;"></i> </span><span onclick="getAccess('+doorsOptions[location][i]._id+')" title="'+doorsOptions[location][i]._id+'" style="cursor:pointer;">'+doorsOptions[location][i].name+'</span></li>';					
				}
			}
			options += '</optgorup>';
			doorsList +='</ul></li>';		
		}
		$('#uDoor').html(options);
		$('#doorsList').html(doorsList);
	});
}

function getAccess(idDoor)
{
	var datos = {
		'doorID': idDoor
	};
	$("#doorImg").html("<img src='/images/doorUbication/"+idDoor+".jpg'/>");
	$.post("/showDoorAccess", datos, function(eventos)
	{
       console.log(eventos);
       if(eventos[0]==null)
       {
       	alert("Esta puerta no posee registros!");
       }else
       {
	       var detalles ='<div id="puerta"><p class="detailTitle">Puerta:'+eventos[0]._door.name+' Localidad:'+eventos[0]._door.location+'</p></div>';
	       console.log(detalles);
	       var tabla='<table class="table"><thead><tr><th>Nombre</th><th>Apellido</th><th>CI</th><th>Email</th><th>Evento</th><th>FechaHora</th></thead><tbody>';
			//datos que quiero para la tabla: nombre de usuario dni, email, descripcion de evento, fecha y accion
			for(var i=0; i<eventos.length; i++)
			{	
				tabla +='<tr><td>'+eventos[i]._user.name+'</td><td>'+eventos[i]._user.lastName+'</td><td>'+eventos[i]._user.dni+'</td><td>'+
				eventos[i]._user.email+'</td><td>'+eventos[i].description+'</td><td>'+eventos[i].date+'</td>';
					
			}
			tabla +='</td></tr></tr></tbody></table>';
	      /// poner en la tabla
	      $("#contentPuerta").html(detalles);
	      $("#showAccess").html(tabla);
		}
	});
}

function doorDel(idDoor)
{
	var r = confirm("Va a borrar una puerta, está seguro?");
	if (r == true) {
	    var datos = {
			'_id':idDoor
	    };
	    $.post("/deleteDoor", datos, function(data, status){
	        console.log(data);
	        if(data == 'borrado'){
	        	alert("Borrado!");	
	        } 
	    });
	} else {
	   alert("Que bueno que pregunté antes! XD");
	}
	getDoors();
}

function getUsers()
{
	var data = {
		'dato': $("#uData").val()
	};
	var usuarios = '';
	$.post("/getUsers", data, function(users){
		console.log(users);
		var usersTable='';
		var doorTable= '';
		if(users.length==0)
       {
       		alert("No hay registros!");
       }else
       {
       		for(var i=0; i<users.length; i++)
       		{
       			usersTable+='<tr style="cursor:pointer;" onclick="$(\'#tabUsers_'+users[i]._id+'\').toggle()"><td>'+users[i].name+'</td><td>'+users[i].lastName+'</td><td>'+users[i].email+'</td><td>'+users[i].phone+'</td><td>'+users[i].dni+'</td></tr>';
       			usersTable+='<tr style="display:none;" id="tabUsers_'+users[i]._id+'"><td colspan="5"><table><tbody>';
       			usersTable+='<tr><td style="cursor:pointer; text-align:center; color:#5BBCEC;" onclick="editUser('+users[i].dni+')"> Editar usuario </td><td style="cursor:pointer; text-align:center; color:#5BBCEC;" onclick="deleteUser('+users[i].dni+')">Eliminar usuario</td></tr>';
       			for(var j=0; j<users[i]._door.length; j++)
       			{
       				usersTable+='<tr><td> Localidad:'+users[i]._door[j].location+'</td><td>Nombre:'+users[i]._door[j].name+'</td></tr>';
       				
       			}
       			usersTable+='</tbody></table></td></tr>';
       		}
       		$("#userInf").html(usersTable);
       }
	});
}

function editUser(userDni){
	userDNI = userDni;
	$("#addUser").show();
	$("#btUpUser").css("display","block");
	$("#btNewUser").css("display","none");
	var datos = {
		'dni':userDni
	};
	$.post("/getAuser", datos, function(user){
		$("#uName").attr("value", user.name);
		$("#uLastname").attr("value", user.lastName);
		$("#uEmail").attr("value", user.email);
		$("#uPhone").attr("value", user.phone);
		$("#uDni").attr("value", user.dni);
		$("#uPassword").attr("value", user.pass);
	});
}
function updUser(){
	var datos = {
		'name': $('#uName').val(),
		'lastName': $('#uLastname').val(),
    	'email': $('#uEmail').val(),
    	'phone':$('#uPhone').val(),
		'dni':$('#uDni').val(),
    	'password': $('#uPassword').val(),
    	'_door': $('#uDoor').val()
    };
    alert($('#uName').val()+" "+$('#uDni').val()+" "+$('#uDoor').val());
    $.post("/updateUser", datos, function(data, status){
        console.log(data);
        console.log(status);
		alert("Actualizado!");
    });	  
}

function abrirPuerta(doorId)
{
	var idDoor= doorId;
	$.post('/openDoor', {'doorID': idDoor}, function(respuesta, status){
		console.log(status);
		if(respuesta.abierto)
		{
			console.log("Se envió el msj para abrir puerta");
		}else{
			console.log("No se pudo enviar el msj para abrir puerta");
		}
	});
}
