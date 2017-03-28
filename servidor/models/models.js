var mongoose = require('mongoose');

module.exports = {
	'Events': mongoose.model('Events', {
		'_user':{'type':mongoose.Schema.Types.ObjectId, 'required':true, 'ref': 'Users'},
		'_door':{'type':String, 'required':true, 'ref':'Doors'},
		'description': {'type': String, 'required': true},
		'date': {'type': Date, 'required': true},
		'action':{'type': String, 'required':true}
	}),

    'Users': mongoose.model('Users', {
    	'name': {'type': String, 'required':true},
    	'lastName':{'type': String, 'required':true},
    	'email':{'type': String, 'required':true,  'unique': true},
    	'phone':{'type': String, 'required':true},
    	'dni':{'type': String, 'required':true},
    	'pass':{'type': String, 'required':true},
        'role':{'type': String, 'required':true},
    	'_door': [{'type': String,  'ref':'Doors' }]
    }),

    'Doors': mongoose.model('Doors', {
    	'name': {'type': String, 'required':true},
    	'_id': {'type': String, 'unique': true, 'index': true, 'required': true},
    	'location': {'type':String, 'required':true, 'ref':'Locations'}
    }),

    'Roles': mongoose.model('Roles', {
        'name': {'type': String, 'required':true}
    }),

    'Locations':mongoose.model('Locations', {
        'name': {'type': String, 'required':true, 'unique': true}
    })
};
