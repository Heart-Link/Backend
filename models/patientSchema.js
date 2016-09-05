var mongoose = require('mongoose');
var Schema = mongoose.Schema,
	ObjectID = Schema.ObjectId;

var patientSchema = new Schema({
	id: ObjectID,
	patientID: {
		type: String
	},
	entryInfo:{
		type: Date
	},
	recommendedVitals:{
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
		targetHR:{
			type: Number // BPM recommended
		}
	}

});
mongoose.model('patientEntry',patientSchema);