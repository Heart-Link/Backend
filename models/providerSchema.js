var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var providerSchema = new Schema ({
	id:{
		type: String,
		unique: true
	}, 
	firstName:{
		type: String 
	},
	lastName:{
		type: String
	},
	username:{
		type: String,
		unique: true
	},
	password:{
		type: String
	},
	type:{
		type: String
	}, 
	patientNetworkList:[String]
});

mongoose.model('provider', providerSchema);