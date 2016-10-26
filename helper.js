const pg = require('pg'); 
const Pool = require('pg').Pool;
const config = require('./config');
const pgbae = new Pool(config.postgresConfig);

module.exports = {
	findDoctor: function(pid){
		pgbae.query('SELECT lastname FROM public.employees WHERE providerid = ($1)', [pid],function(err, results){
			if(err) throw err; 
			if(results.rows.length != 0){
				return results.rows[0].lastname;
			}
		});
	}
}