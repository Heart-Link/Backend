var mongoose = require('mongoose');
var moment = require('moment');
var Schema = mongoose.Schema,
	ObjectID = Schema.ObjectId;

var patientSchema = new Schema({
	id: ObjectID,
	patientID: {
		type: String
	},
	entryInfo:{
		type: String,
		default: moment().format()
	},
	bpHigh:{
		type: Number
	}, 
	bpLow:{
		type: Number
	},
	weight:{
		type:Number
	},
	exerciseTime:{
		type: Number //Minutes daily
	},
	alcoholIntake:{
		type: Number //glasses of alcohol per day
	},
	steps:{
		type: Number //Number of steps a day
	},
	averageHR:{
		type: Number // Average daily BPM
	},
	stressLevel:{
		type: Number
	},
	smoke:{
		type: Boolean
	}
	

});
module.exports = mongoose.model('patientEntry',patientSchema);