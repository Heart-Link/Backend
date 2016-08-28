var mongoose = require('mongoose');
var Schema = mongoose.Schema,
	ObjectID = Schema.ObjectId;

var patientSchema = new Schema({
	id: ObjectID,
	firstName:{
		type: String
	},
	lastName:{ 
		type: String
	},
	foodServings:{
		redMeat:{
			type: Number; 
		},
		whiteMeat:{
			type: Number;
		},
		fish:{
			type: Number;
		},
		vegetables:{
			type: Number;
		},
		fruit:{
			type: Number;
		},
		grain:{
			type: Number;
		},
		sweets:{
			type: Number;
		},
		soda:{
			type: Number;
		},
		water:{
			type: Number;
		}
	},
	sexualActivity:{
		type: Boolean;
	},
	stressLevel{
		type: Number, min: 1, max: 10
	},
	recommendedVitals:{
		bloodPressureHigh:{
			type: Number
		}, 
		bloodPressureLow:{
			type: Number
		},
		weight:{
			type:Number
		},
		alcoholIntake:{
			type: Number
		}, 
		smoke:{
			type: Boolean
		}
	},
	status:{
		type: Number
	},
	providerID:{
		type:String,
		unique: true; 
	},
	managerID:{
		type: String,
		unique: true
	},
	conversationID: {
		type: String
	},
	healthFlag: { 
		type: Boolean
	}
});

mongoose.model('patient',patientSchema);