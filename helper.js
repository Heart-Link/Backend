const pg = require('pg'); 
const Pool = require('pg').Pool;
const config = require('./config');
const pgbae = new Pool(config.postgresConfig);
const async = require('async');
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
		var score;
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
			return resultCounter;
		});
	
	
	}
	
}