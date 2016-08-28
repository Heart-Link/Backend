var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var managerSchema = new Schema({ 
	id:{
		type: String,
		unique: true
	},
	firstName:{
		type: String;
	},
	lastName:{
		type: String; 
	}, 
	username:{
		type: String, 
		unique: true
	},
	password:{
		type:String
	}, 
	title:{
		type: String
	},
	patientNetworkList:[String]

});
mongoose.model('manager', managerSchema); 