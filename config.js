const patientEntry = require('./models/patientEntry.js'); 
const async = require('async'); 
module.exports= {
	postgresConfig : {
		user: 'sagar',
		database: 'patientNetwork',
		password: 'mistryohsd',
		host: 'seniordesign.ceweg4niv3za.us-east-1.rds.amazonaws.com',
		port: 5432,
		max: 10,
		idleTimeoutMillis: 50
	},	
	mongo : 'mongodb://mongobot:heartlink@ec2-54-163-104-129.compute-1.amazonaws.com:27017/heartlink',
	secret: 'HaR@mb3',
	objectWizard: function(entry){
		console.log(entry);
		if(entry.length < 1){
			return entry;
		}
		var object = {
		  "bpHigh": entry[0].dailyEntry.bpHigh,
          "bpLow": entry[0].dailyEntry.bpLow,
          "weight": entry[0].dailyEntry.weight,
          "exerciseTime": entry[0].dailyEntry.exerciseTime,
          "alcoholIntake": entry[0].dailyEntry.alcoholIntake,
          "steps": entry[0].dailyEntry.steps,
          "averageHR": entry[0].dailyEntry.averageHR,
          "stressLevel": entry[0].dailyEntry.stressLevel,
          "smoke": entry[0].dailyEntry.smoke,
          "entryInfo": entry[0].entryInfo
		}
		return object;
	},
	sortPatients:function(results){
		const PatientList = [];
		var patientCount = results.rowCount;
		for(var x = 0; x<patientCount;x++){
			async.series([
				function getLatestEntry(callback) {
					patientEntry.find({"patientID":results.rows[x].emrid}).sort({"entryInfo": -1}).limit(1).exec(function(err,entry){
						return callback(null,entry);
					});
				}
				],
				function createPatient(err,entry){
					console.log(results);
					var patient = {
						 firstName: results.rows[x].firstname,
						 lastName: results.rows[x].lastname,
						 pid: results.rows[x].emrid,
						 provider: results.rows[x].providerid,
						 sex: results.rows[x].gender,
						 dob: results.rows[x].dob,
						 weight: results.rows[x].weight,
						 lastInput: entry,
						 message: results.rows[x].convoid
						};
					PatientList.push(patient);
				});

				
		}
		var rv = {};
		for (var i = 0; i < PatientList.length; ++i)
		    if (PatientList[i] !== undefined) rv[i] = PatientList[i];
		return rv;
	}


};