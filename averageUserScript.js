const mongoose = require('mongoose'); 
const pg = require('pg');
const Pool = require('pg').Pool; 
const async = require('async');
const pgbae = new Pool(config.postgresConfig);
mongoose.connect(config.mongo);

// Get list of Networks
// get list of patients in a network
// pull all entries of patients for a given date 
// form averages for each entry 
// store in "averageUser"
async.waterfall([
		function getNetworks(callback){
			pgbae.connect(function(client,err,done){
					if(err) throw err;
					client.query('SELECT patientlist FROM public.network WHERE networkid = ($1)',[NETWORKID],function(err,res){
						if(err) throw err;
					}
				});
		},
		function getPatients(callback){

		},
		function avaerageEntry(callback){

		},
		function storeDailyAverage(){
			
		}
	]);

