var mongoose = require('mongoose'); 
var Schema = mongoose.Schema,
	ObjectID = Schema.ObjectId;

var network = new Schema({
	networkID : ObjectID
	networkName:{
		type: String
	},
	patientList:[String],
	providerList:[String],
	managerList:[String]

});
mongoose.model('network',network); 