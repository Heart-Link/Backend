const pg = require('pg'); 
const Pool = require('pg').Pool;
const config = require('./config');
const pgbae = new Pool(config.postgresConfig);
const Promise = require('bluebird'); 
function getScore(score){
		return score;
	}
module.exports = {
	findDoctor: function(pid){
		pgbae.query('SELECT lastname FROM public.employees WHERE providerid = ($1)', [pid],function(err, results){
			if(err) throw err; 
			if(results.rows.length != 0){
				return results.rows[0].lastname;
			}
		});
	},
	runAnalysis: function(entryInformation){
		return new Promise( function(resolve, reject){
			pgbae.query('SELECT vitalsbph, vitalsbpl, weight, vitalsalcohol, exercisetime, steps, vitalsbpm, weight FROM public.patients WHERE emrid = ($1)', [entryInformation.patientID],function(err,results){
				var resultCounter = 0; 
				if(results.rows[0].vitalsweight > entryInformation.weight){
					resultCounter++;
				}
				if(results.rows[0].vitalsbph > entryInformation.bpHigh){
					resultCounter++;
				}
				if(results.rows[0].vitalsbpl > entryInformation.bpLow){
					resultCounter++;
				}
				if(results.rows[0].vitalsalcohol > entryInformation.alcoholIntake){
					resultCounter++;
				}
				if(results.rows[0].exercisetime > entryInformation.exerciseTime){
					resultCounter++;
				}
				if(results.rows[0].steps > entryInformation.steps){
					resultCounter++;
				}
				if(results.rows[0].vitalsbpm < entryInformation.averageHR){
					resultCounter++;
				}
				if(entryInformation.smoke !== 0){
					resultCounter++;
				}
				resolve(resultCounter);
			});
		});
	},
	formatMessages: function(idKeys, messages){
		var provider = idKeys.providerid;
		var manager = idKeys.managerid; 
		var patient = idKeys.patientid;

		var newFormat = [];
		for(x = 0; x<messages.length; x++){
			if(messages[x].messengerid === patient){
				var msgToAppend = {
					'convoid' : messages[x].convoid,
					'messengerid' : messages[x].messengerid,
					'reduxid' : 0,
					'message' : messages[x].message,
					'timestamp' : messages[x].timestamp
				};
				newFormat.push(msgToAppend);
			}
			else if(messages[x].messengerid === manager){
				var msgToAppend = {
					'convoid' : messages[x].convoid,
					'messengerid' : messages[x].messengerid,
					'reduxid' : 1,
					'message' : messages[x].message,
					'timestamp' : messages[x].timestamp
				};
				newFormat.push(msgToAppend);
			}  
			else if(messages[x].messengerid === provider){
				var msgToAppend = {
					'convoid' : messages[x].convoid,
					'messengerid' : messages[x].messengerid,
					'reduxid' : 2,
					'message' : messages[x].message,
					'timestamp' : messages[x].timestamp
				};
				newFormat.push(msgToAppend);
			} 
		}
		return newFormat;
	}
	
}
