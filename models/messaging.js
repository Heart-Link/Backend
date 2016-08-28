var mongoose = require('mongoose');
var Schema = mongoose.Schema; 

var messageSchema = new Schema({ 
	conversationID:{
		type: String,
		unique: true
	}, 
	patientID:{
		type: String,
		unique: true
	}, 
	providerID:{
		type: String,
		unique: true
	}, 
	managerID:{
		type: String,
		unique: true
	}, 
	// ADD MYSQL MESSAGE STUFF
});

mongoose.model('message',messageSchema);