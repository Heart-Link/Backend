var mongoose = require('mongoose');
var moment = require('moment');
var Schema = mongoose.Schema,
	ObjectID = Schema.ObjectId;

var tempAuth = new Schema({
	id: ObjectID,
	userEmail:{
		type: String
	},
	tempID:{
		type: Number
	}
});
module.exports = mongoose.model('tempAuth',tempAuth);