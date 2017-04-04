$(document).ready(function()
{
	//getDoors();
	getLocations();
	getRoles();
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
    $.post("/login", datos,  function(data, status){
        if(data =='incorrecto'){
        	alert("verifique los datos e intente de nuevo!");
        	console.log("datos de login incorrecto");
        }else{
        	console.log("datos de login correcto");
        	location.href="http://localhost/home";
        }
    });
}

function getThisRole(callback){    
	$.post("/getThisRole", function(user){   
		var userRole = user.role;     
		callback(userRole);    
		console.log("userRole: "+userRole);
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
	var listLocation;
	$.post("/getLocations",function(locations){
		listLocation='';
		if (locations) 
		{	
			for(var i=0; i<locations.length; i++)
			{
				listLocation+='<option value="'+locations[i].name+'">'+locations[i].name+'</option>';
			}
			$('#doorLocation').html(listLocation);
		}
	});
	$("#formDoor").show();
}
function locationForm(){
	$("#formLocation").show();
}
function cerrar(){
	$("#addUser").hide();
	$("#formDoor").hide();
	$("#formLocation").hide();
}

function newUser(){
	var datos = {
		'name': $('#uName').val(),
		'lastName': $('#uLastname').val(),
    	'email': $('#uEmail').val(),
    	'phone':$('#uPhone').val(),
		'dni':$('#uDni').val(),
		'role': $('#uRole').val(),
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
    getUsers();
}

function newLocation(){
	var datos = {
		'name': $('#locationName').val(),
    };
    $.post("/createLocation", datos, function(data, status){
        console.log("data of location: "+data);
        if(data == 'creado'){
        	alert("Guardado!");	
        }
        getLocations(); 
    });
}
 
function getLocations(){
	var locationsList = ''; 
	$.post("/getLocations",function(locations)
	{	
		if (locations) 
		{	
			for(var i=0; i<locations.length; i++)
			{
				locationsList+='<li>'+locations[i].name+'</li>';
			}
			$('#locationsList').html(locationsList);
		}
	});	
}

function newDoor(){
	var datos = {
		'name': $('#doorName').val(),
		'_id': $('#doorId').val(),
    	'_location': $('#doorLocation').val()
    };
    $.post("/createDoor", datos, function(data, status){
        console.log(data);
        if(data == 'creado'){
        	alert("Guardado!");	
        }
        getDoors(); 
    });
}

function getDoors()
{
	var options = '';
	var doorsList = '';
	var thisRole;
	getThisRole(function(role){
		thisRole = role;
	});
	$.post("/getDoors",function(doors)
	{
		var doorsOptions = {};
		for(var i=0; i<doors.length; i++)
		{
			if(!doorsOptions[doors[i]._location])
			{
				doorsOptions[doors[i]._location] = [];
			}
			doorsOptions[doors[i]._location].push({
				name: doors[i].name,
				_id: doors[i]._id
				//_location:doors[i]._location
			});
		}
		//para el select y el listado de puertas
		for(var location in doorsOptions)
		{	
			options += '<optgroup label="'+location+'">';
			doorsList +='<li><p class="listTitle">'+location+'</p><ul>';
			for(var i=0; i<doorsOptions[location].length; i++)
			{
					options += '<option value="'+doorsOptions[location][i]._id+'">'+doorsOptions[location][i].name+'</option>';				
					doorsList +='<li  class="addElement"><span title="ABRIR" onclick="abrirPuerta('+doorsOptions[location][i]._id+')"><i class="fa fa-sign-in" aria-hidden="true" style="cursor:pointer;"></i> </span><span title="ELIMINAR" onclick="doorDel('+doorsOptions[location][i]._id+')"><i class="fa fa-times" aria-hidden="true" style="cursor:pointer;"></i> </span><span onclick="getAccess('+doorsOptions[location][i]._id+')" title="'+doorsOptions[location][i]._id+'" style="cursor:pointer;">'+doorsOptions[location][i].name+'</span></li>';				
			}
			options += '</optgorup>';
			doorsList +='</ul></li>';		
		}
		$('#uDoor').html(options);
		$('#doorsList').html(doorsList);
	});
}

function getDoors2()
{
	var options = '';
	var doorsList = '';
	$.post("/getDoors",function(doors)
	{
		var doorsOptions = {};
		for(var i=0; i<doors.length; i++)
		{
			if(!doorsOptions[doors[i]._location])
			{
				doorsOptions[doors[i]._location] = [];
			}
			doorsOptions[doors[i]._location].push({
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
					options += '<option value="'+doorsOptions[location][i]._id+'">'+doorsOptions[location][i].name+'</option>';				
					doorsList +='<li  class="addElement"><span onclick="getAccess('+doorsOptions[location][i]._id+')" title="'+doorsOptions[location][i]._id+'" style="cursor:pointer;">'+doorsOptions[location][i].name+'</span></li>';
			}
			options += '</optgorup>';
			doorsList +='</ul></li>';		
		}
		$('#uDoor').html(options);
		$('#doorsList').html(doorsList);
	});
}

function getRoles(){
	var roles='';
	$.post("/getRoles", function(rol)
	{
		if(rol.length>0)
		{
			for (var i = rol.length - 1; i >= 0; i--) {
				roles+='<option value="'+rol[i].name+'">'+ rol[i].name +'</option>'
			}
			$("#uRole").html(roles);
		}
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
       var detalles ='';
       var tabla = '';
       if(eventos[0]==null)
       {
       	alert("Esta puerta no posee registros!");
       }else
       {
       		var detalles ='<div id="puerta"><p class="detailTitle">Puerta:'+eventos[0]._door.name+' Localidad:'+eventos[0]._door._location+'</p></div>';
	       	tabla+='<table class="table"><thead><tr><th>Nombre</th><th>Apellido</th><th>CI</th><th>Email</th><th>Evento</th><th>FechaHora</th></thead><tbody>';
			for(var i=0; i<eventos.length; i++)
			{	
				tabla +='<tr><td>'+eventos[i]._user.name+'</td><td>'+eventos[i]._user.lastName+'</td><td>'+eventos[i]._user.dni+'</td><td>'+
				eventos[i]._user.email+'</td><td>'+eventos[i].description+'</td><td>'+eventos[i].date+'</td>';
					
			}
			tabla +='</td></tr></tr></tbody></table>';
		}

	      $("#contentPuerta").html(detalles);
	      $("#showAccess").html(tabla);
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
	        getDoors();
	    });
	} else {
	   alert("Que bueno que pregunté antes! XD");
	}
}

function getUsers()
{

	var data = {
		'dato': $("#uData").val()
	};
	var usuarios = '';
	var thisRole;
	getThisRole(function(role)
	{
		thisRole= role;
	});

	$.post("/getUsers", data, function(users){
		var usersTable='';
		var doorTable= '';
		if(users.length==0)
       {
       		alert("No hay registros!");
       }else
       {
       		for(var i=0; i<users.length; i++)
       		{
       			usersTable+='<tr title="'+users[i]._door.length+'" style="cursor:pointer;" onclick="$(\'#tabUsers_'+users[i]._id+'\').toggle();"><td>'+users[i].name+'</td><td>'+users[i].lastName+'</td><td>'+users[i].email+'</td><td>'+users[i].phone+'</td><td>'+users[i].dni+'</td>';
       			usersTable+='<td><i class="fa fa-pencil-square-o" aria-hidden="true" style="cursor:pointer;" onclick="editUser('+users[i].dni+')"></i></td><td><i class="fa fa-times" aria-hidden="true" style="cursor:pointer;" onclick="deleteUser('+users[i].dni+')"></i></td></tr>';
       			/*usersTable+='<tr style="display:none;" id="tabUsers_'+users[i]._id+'"><td colspan="5"><table><tbody>';
       			usersTable+='<tr><td style="cursor:pointer; text-align:center; color:#5BBCEC;" onclick="editUser('+users[i].dni+')"> Editar usuario </td>';
       			usersTable+='<td style="cursor:pointer; text-align:center; color:#5BBCEC;" onclick="deleteUser('+users[i].dni+')">Eliminar usuario</td></tr>';*/
       			usersTable+='<tr style="display:none;" id="tabUsers_'+users[i]._id+'"><td colspan="7"><table><thead><th>Localidad</th><th>Nombre</th></thead><tbody>';
       			for(var j=0; j<users[i]._door.length; j++)
       			{
       				usersTable+='<tr><td>'+users[i]._door[j]._location+'</td><td>'+users[i]._door[j].name+'</td></tr>';
       			}
       			usersTable+='</tbody></table></td></tr>';
       		}
       		$("#userInf").html(usersTable);
       }
	});
}

function getUsers2()
{
	var data = {
		'dato': $("#uData").val()
	};
	var usuarios = '';
	$.post("/getUsers", data, function(users){
		var usersTable='';
		var doorTable= '';
		if(users.length==0)
       {
       		alert("No hay registros!");
       }else
       {
       		for(var i=0; i<users.length; i++)
       		{
       			usersTable+='<tr title="'+users[i]._door.length+'" style="cursor:pointer;" onclick="$(\'#tabUsers_'+users[i]._id+'\').toggle();"><td>'+users[i].name+'</td><td>'+users[i].lastName+'</td><td>'+users[i].email+'</td><td>'+users[i].phone+'</td><td>'+users[i].dni+'</td>';
       			//usersTable+='<td><i class="fa fa-pencil-square-o" aria-hidden="true" style="cursor:pointer;" onclick="editUser('+users[i].dni+')"></i></td><td><i class="fa fa-times" aria-hidden="true" style="cursor:pointer;" onclick="deleteUser('+users[i].dni+')"></i></td></tr>';
       			usersTable+='<tr style="display:none;" id="tabUsers_'+users[i]._id+'"><td colspan="7"><table><thead><th>Localidad</th><th>Nombre</th></thead><tbody>';
       			for(var j=0; j<users[i]._door.length; j++)
       			{
       				usersTable+='<tr><td>'+users[i]._door[j]._location+'</td><td>'+users[i]._door[j].name+'</td></tr>';
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
	$("#btUpUser").show();
	$("#btNewUser").hide();
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
    	'role': $('#uRole').val(),
    	'_door': $('#uDoor').val()
    };
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
