module.exports= {
	secret: 'HaR@mb3',

	sortPatients:function(results){
		const PatientList = [];
		var patientCount = results.rowCount;
		for(var x = 0; x<patientCount;x++){
			var patient = {
				 firstName: results.rows[x].firstname,
				 lastName: results.rows[x].lastname,
				 pid: results.rows[x].emrid,
				 provider: results.rows[x].providerid,
				 sex: results.rows[x].gender,
				 dob: results.rows[x].dob,
				 weight: results.rows[x].weight,
				 lastInput: {},
				 message: results.rows[x].convoid
			};
			PatientList.push(patient);
		}
	return PatientList;
	}
};