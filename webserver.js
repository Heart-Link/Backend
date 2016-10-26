const express = require('express');
const bodyparser = require('body-parser');
const bcrypt = require('bcrypt');
const circularSalt = 10;
const mongoose = require('mongoose'); 
const pg = require('pg');
const Pool = require('pg').Pool; 
const url = require('url');
const moment = require('moment'); 
const app = express(); 
const router = express.Router();
const async = require('async');
const config = require('./config');
require('events').EventEmitter.prototype._maxListeners = 100;

const jwt = require('jsonwebtoken');

app.use(bodyparser.urlencoded({ extended: true}));
app.use(bodyparser.json());
app.set('secret',config.secret);

var port = process.env.PORT || 8080;


// ------------- include Models -------------------

const patientEntry = require('./models/patientEntry.js');
const account = require('./models/account.js'); 
const tempAuth = require('./models/tempAuth.js');
const pgbae = new Pool(config.postgresConfig);
mongoose.connect(config.mongo);


//-------------------------------------------|
//-------------------------------------------|
//------------User Authentication------------|
//-------------------------------------------|
//-------------------------------------------|


app.post('/login', function(req,res){
	async.waterfall([
			function iscorrect(callback){
				account.findOne({ userEmail: req.body.email },function(err,record){
					 bcrypt.compare(req.body.password, record.password, function(err,success){
					 	if(success){
					 		return callback(null, record);
					 	}
					 	else{
					 		res.status(200).json({
					 			success: false
					 		}); 
					 	}
					 })
				});
			},
			function token(record){
				pgbae.query('SELECT firstname, providerid,isdoctor FROM public.employees WHERE username = ($1)',[req.body.email], function(err,result){
		 			if(err){
		 				res.status(200).json({
				 			success: false
				 		}); 
		 			}
			 		var token = jwt.sign(record, app.get('secret'),{
			 			expiresIn: 60*60*24
			 		});
			 		res.json({
			 			firstname: result.rows[0].firstname.trim(),
			 			providerid: result.rows[0].providerid, 
			 			isdoctor: result.rows[0].isdoctor,
			 			token: token
			 		});
		 		});
			}
	]);
});

app.get('/logout', function(req,res){

});
app.post('/register', function(req,res){ // Make this async
	var result = "success"; 
	tempAuth.findOne({userEmail: req.body.email}, function(err,res){
		if(res.tempID == req.body.verificationCode){
			bcrypt.genSalt(circularSalt,function(err,salt){
				bcrypt.hash(req.body.password,salt, function(err,hash){
					var user = new account({
									userEmail: req.body.email,
									password: hash,
									networkID: req.body.networkid,
									userType: req.body.userType,
									deviceID: req.body.deviceID
								});
					user.save(function(err){
						if(err) throw err;
						console.log('User Registration submitted');
					});
				});
			});
		}
		
	});	
	res.status(200).json(result);
});


router.use(function(req,res,next){
	 var token = req.body.token || req.query.token || req.headers['x-access-token'];
	 if(token){
			 	 // verifies secret and checks exp
		    jwt.verify(token, app.get('secret'), function(err, decoded) {      
		      if (err) {
		        return res.json({ success: false, message: 'Failed to authenticate token.' });    
		      } else {
		        // if everything is good, save to request for use in other routes
		        req.decoded = decoded;    
		        next();
		      }
		    });
		 } else {
			    // if there is no token
			    // return an error
			    return res.status(403).send({ 
			        success: false, 
			        message: 'No token provided.' 
			    });
	 }
});



//-------------------------------------------|
// Patient System Routes					 |
// 											 |
// 											 |
// 											 |
//-------------------------------------------|

router.get('/patientList:id',function(req,res){  // Get list of Patients based off the user ID (either Patient or Manager)
	pgbae.connect(function(err, client, done){
		if(err){
			return console.error('error connecting client to pool: '+ err);
		}
		client.query('SELECT * FROM public.patients WHERE managerid = ($1)',[req.query.id], function(err,results){
			initialize(results);
			function initialize(results){
				const PatientList = [];
				getLatestInput(results, PatientList);
			}
			function getLatestInput(results, PatientList){
				var patientCount = results.rowCount;
				for(x = 0; x<patientCount;x++){
					var counter = 0;
					patientEntry.find({"patientID":results.rows[x].emrid}).sort({"entryInfo": -1}).limit(1).exec(function(err,entry){
							var patient = {
								 firstName: results.rows[counter].firstname,
								 lastName: results.rows[counter].lastname,
								 pid: results.rows[counter].emrid,
								 provider: results.rows[counter].providerid,
								 sex: results.rows[counter].gender,
								 dob: results.rows[counter].dob,
								 weight: results.rows[counter].weight,
								 lastInput: config.objectWizard(entry),
								 status: results.rows[counter].status,
								 message: results.rows[counter].convoid
								};
							counter++;
							PatientList.push(patient);
							if(counter === patientCount){
								convertAndSend(PatientList);
							}
					});
			
				}	
			}
			
			function convertAndSend(PatientList){
				res.status(200).send(PatientList)
			}	
		});
		client.release();
	});
	pgbae.on('error', function (err, client) {  
 		 console.error('idle client error', err.message, err.stack)
	});
});

router.post('/patient/submitData', function(req,res){   //Patient Submitting Daily Entry from their iPhone
	console.log(res);
	var entry = new patientEntry({
		patientID : req.body.patientID,
		entryInfo : req.body.entryInfo,
		bpHigh: req.body.bpHigh,
		bpLow:req.body.bpLow,
		weight:req.body.weight,
		exerciseTime:req.body.exerciseTime,
		alcoholIntake:req.body.alcoholIntake,
		steps:req.body.steps,
		averageHR:req.body.averageHR,
		stressLevel:req.body.stressLevel,
		smoke:req.body.smoke
	});
	entry.save(function(err){
		if(err) throw err;
		console.log('Patient Entry submitted');
	});
	pgbae.connect(function(err,client,done){
		client.query('UPDATE public.patients SET gameification = gameification + 1 WHERE emrid = ($1)',[req.body.patientID],function(err,res){
			if(err) throw err;
			console.log(res);    
		});
		client.release();
	});   // Patient submits Health entry. Add values to mongo and save 
	res.sendStatus(200);
});

router.post('/patients/create', function(req,res){   //Create a Patient from Web Portal
	/* 
		step 1: make conversation, generate patientID and save the convoID
		step 2: make patient and input information
		step 3: save all 
		Notes: GenID is for messages, using EMRID for all patient ID needs
		*/
	console.log(req.body);
	var sugar = bcrypt.genSaltSync(circularSalt);
	var genID = bcrypt.hashSync(req.body.emrid, sugar); // Used for messages
	var convo = "INSERT INTO public.messages (networkid, convoid, patientid, providerid, managerid) VALUES ('$2a$10$mm6Gn/Jw6TEmhlxtXsWQvuJV8U7AwjBE/hhz8a503Fo4xFAoEAPmC','"+genID+"','"+req.body.emrid+"','"+req.body.providerid+"','"+req.body.managerid+"')";
	var statement = "INSERT INTO public.patients (firstname, lastname, vitalsbph, vitalsbpl, vitalsweight, vitalsalcohol, status, managerid, convoid, emrid, patientemail, gender, steps, exercisetime, gameification,providerid,networkid) VALUES " +
				"('" + req.body.firstname + 
				"','" +req.body.lastname +
				"','" +req.body.vitalsbph +
				"','" +req.body.vitalsbpl +
				"','" +req.body.vitalsweight +
				"','" +req.body.vitalsalcohol +
				"','" +req.body.status +
				"','" +req.body.managerid +
				"','" +genID +
				"','" +req.body.emrid +
				"','" +req.body.patientEmail + 
				"','" +req.body.gender +
				"','" +req.body.steps +
				"','" +req.body.exercisetime +
				"','0','" + req.body.providerid +
				"','$2a$10$mm6Gn/Jw6TEmhlxtXsWQvuJV8U7AwjBE/hhz8a503Fo4xFAoEAPmC')";
	new tempAuth({
		userEmail: req.body.patientEmail,
		tempID: Math.floor(Math.random()*90000) + 10000
	}).save(function(err,res){
		if(err) throw err;
	});
	pgbae.connect(function(err,client,done){
		if(err){
			return console.error('error connecting client to pool: '+ err);
		}
		var providerName,
			mangerName;

		client.query(convo, function(err,result){ // SEND create Message Command
			if(err) throw err;
		});
		client.query(statement,function(err,result){ // send Create Patient Command
			if(err) throw err;
		});
		res.status(200).json("Patient Added Successfully"); 
		client.release(); 
	});   
});

router.post('/patients/update', function(req,res){ // Update a Patient from Web Portal
	pgbae.connect(function(err,client,done){
		client.query('UPDATE public.patients SET vitalsbph = ($1), vitalsbpl = ($2), vitalsweight = ($3), vitalsalcohol = ($4), managerid = ($5), patientEmail = ($6), steps = ($7), exercisetime = ($8), providerid = ($9) WHERE emrid = ($10)',
			[req.body.vitalsbph, req.body.vitalsbpl, req.body.vitalsweight, req.body.vitalsalcohol, req.body.managerid, req.body.patientEmail, req.body.steps, req.body.exercise, req.body.providerid, req.body.patientID],
			function(err,results){
				if(err){
					throw err;
				}
				console.log(results); 
				res.sendStatus(200);
			});
		client.release();
	})
}); 

router.delete('/patients/delete', function(req,res){ // Delete a Patient from the Web Portal
	pgbae.connect(function(err,client,done){
		client.query('DELETE FROM public.patients WHERE emrid = ($1)', [req.body.patientID], function(err,results){
			if(err){
				res.status(300).json(results);
			}
			res.sendStatus(200); 
		});
		client.release();
	});
});

router.get('/patients/collect:id',function(req,res){  //  Get an individual patient based off EMR from Web Portal
	console.log(req.query);
	var patientID = req.query.id; 
	async.waterfall([
		function getPatientInformation(callback){
			pgbae.connect(function(err,client,done){
				if(err){
					throw err;
				}
				client.query('SELECT * FROM public.patients WHERE emrid = ($1)',[patientID],function(err,results){
					return callback(null, results.rows[0]);
				});
				client.release();
			});
		},
		function getPatientSubmssions(patientInformation){
			patientEntry.find({patientID: patientInformation.emrid},function(err,results){
				res.status(200).json(results);
			});
		}
		]);
});


//-------------------------------------------|
// Message System Routes					 |
//-------------------------------------------|

router.post('/messages/patient/send',function(req,res){ 
	
});


router.post('/messages/id',function(req,res){  // Send a Message from either Web Portal or Phone
 	/* 
 	1. get Message , messenger ID and conversationID
 	2. Use ConversationID as connecting Key 
 	3. Post message */
 	var message = req.body.message,
 		messenger = req.body.messengerID, // Either Doctor, Patient, or Manager.
 		conversationID = req.body.conversationid; 

 	pgbae.connect(function(err, client, done){
 		if(err){
 			console.log('message Post Err: '+err); 
 		}client.query({
 			text: "INSERT INTO public.messagecontent (convoid,message,messengerid,timestamp) VALUES ($1, $2, $3, $4)",
 			values: [conversationID, message, messenger, moment().format()]
 		});
 		console.log('message Posted');
 		res.sendStatus(200);
 		client.release();
 	});
});
 
router.get('/messages:patient',function(req,res){ // Get a conversation with a patient
		/* 1. Use EMR ID (passed by Req.query) to get conversation ID from public.messages
			2. Get all messages from public.messagecontent with conversationID
			3. SORT BY MOST RECENT DATE */
		async.waterfall(
			[
				function getConversationID(callback){
						pgbae.connect(function(err,client,done){
							if(err){
								console.log('get Message error: '+ err)
							}
							var conversationID; 
							var statement = "SELECT * FROM public.messages WHERE patientid ="+req.query.patient+"::text";

							client.query(statement,function(err,res){
								return callback(null,res.rows[0].convoid,res.rows[0]);
							});
							client.release();
						});
					},
				function getMessages(convoID,callback){
		 			 	pgbae.connect(function(err,client,done){
						 	if(err){
						 		console.log('get Message error: '+ err)
						 	}
						 	var message = [];
						 	message.push(callback);
						 	client.query("SELECT * FROM public.messagecontent WHERE convoid = ($1)",[convoID],function(err,data){
						 		message.push(data.rows);
						 		res.json(message);
						 	});
						 	client.release();
						 });
				}
			]
		);
});
router.post('/network/create', function(req,res){
	bcrypt.genSalt(circularSalt, function(err, salt) {
	    bcrypt.hash(req.body.networkname, salt, function(err, hash) {
	         pgbae.connect(function(err,client,done){
	         	if(err){
	         		console.log('cant connect: '+err);
	         	}
	        	client.query("INSERT INTO public.network (networkid, networkname) VALUES ('"+hash+"','"+req.body.networkname+"')");
	        	done();
	        	client.release();
	       	});
	    });
	});
});

app.post('/makeEmployee',function(req,res){
	var salty = bcrypt.genSaltSync(circularSalt);
	var employee = {
		firstname: req.body.firstname, 
		lastname: req.body.lastname,
		username: req.body.email, 
		title: req.body.title,
		networkID: req.body.networkid,
		employeeID: bcrypt.hashSync(req.body.firstname + req.body.lastname + req.body.username, salty)
	}
	if(req.body.type == 'Provider'){
		pgbae.query('INSERT INTO public.employees(firstname, lastname,  username, title, isdoctor, networkid, providerid) VALUES ($1, $2, $3, $4, $5, $6, $7)',[employee.firstname, employee.lastname, employee.username, employee.title,true, employee.networkID, employee.employeeID], function(err,results){
			if(err) throw err;
			res.status(200).json("Provider Made");
		});
	}
	else{
		pgbae.query('INSERT INTO public.employees(firstname, lastname,  username, title, isdoctor, networkid, providerid) VALUES ($1, $2, $3, $4, $5, $6, $7)',[employee.firstname, employee.lastname, employee.username, employee.title,false, employee.networkID, employee.employeeID], function(err,results){
			if(err) throw err;
			res.status(200).json("Manager Made");
		});
	}
	new tempAuth({
		userEmail: req.body.email,
		tempID: 1
	}).save(function(err,res){
		if(err) throw err;
	});


})

router.get('/',function(req,res){
	res.json({ message: 'Less than 2 months til Final presentaion'});
});

app.use('/',function(req,res,next){
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "X-Requested-With, Content-Type, Accept");
	next();
});
//Register routes with a prefix for the API 
app.use('/api',router);
app.listen(port);
console.log('The Party is on port '+ port);
