var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var gameification = new Schema({ 
	patientID: {
		type: String
	},
	treeLevel{
		type: Number   // % 28 to find level of tree
	}
});

mongoose.model('gameification',gameification); 