var mongoose = require('mongoose');
var moment = require('moment');
var Schema = mongoose.Schema,
	ObjectID = Schema.ObjectId;

var account = new Schema({
	id: ObjectID,
	userEmail:{
		type: String
	},
	password:{
		type: String
	},	
	networkID:{
		type: String
	},
	userType:{
		type: String
	},
	deviceID:{
		type: String
	},
	userID:{
		type: String
	}
});
module.exports = mongoose.model('account',account);