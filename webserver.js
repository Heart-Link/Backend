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
const helper = require('./helper'); 
const apn = require('apn'); 
const nodemailer = require('nodemailer'); 
const transporter = nodemailer.createTransport('smtps://heartlinkucf@gmail.com:SeniorDesign@smtp.gmail.com');
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

const apnProvider = new apn.Provider({
	token: {
		key: 'APNsAuthKey_42562SC893.p8',
		keyId: '42562SC893', 
		teamId: '9NTVF3V67K'
	},
	production: false
});

app.get('/test', function(req,res){
	var note = new apn.Notification();

	note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
	note.badge = 3;
	note.sound = "ping.aiff";
	note.alert = "\uD83D\uDCE7 \u2709 You have a new message";
	note.payload = {'messageFrom': 'John Appleseed'};
	note.topic = "Pickering.HeartLink";

	apnProvider.send(note, '365f09885fc38f89225996080b631e5ca54531319d4a46121a754aed0f56fcb6').then( (result) => {
		//if(err) throw err;
	  	console.log(result);
	});

	console.log("hi");
});
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
app.post('/login/patient', function(req,res){
	async.waterfall([
			function iscorrect(callback){
				account.findOne({ userEmail: req.body.email },function(err,record){
					 bcrypt.compare(req.body.password, record.password, function(err,success){
					 	if(success){
					 		console.log('success'); 
					 		return callback(null, record);
					 	}
					 	else{
					 		console.log('loginfail)');
					 		res.status(200).json({
					 			success: false
					 		}); 
					 	}
					 })
				});
			},
			function token(record){
				var update = {deviceID: req.body.deviceID};
				account.findOneAndUpdate({userEmail : record.userEmail}, update, function(err,result){
					if(err) throw err;
					console.log('record updated');
				});
				pgbae.query('SELECT firstname, networkid, convoid, gameification, emrid FROM public.patients WHERE patientemail = ($1)',[req.body.email], function(err,results){
		 			if(err){
		 				res.status(200).json({
				 			success: false
				 		}); 
		 			}
		 			console.log(results);
			 		var token = jwt.sign(record, app.get('secret'),{
			 			expiresIn: 60*60*24
			 		});
			 		res.json({
			 			networkid: results.rows[0].networkid, 
			 			convoid: results.rows[0].convoid,
			 			gameification: results.rows[0].gameification, 
			 			emrid: results.rows[0].emrid,
			 			token: token
			 		});
		 		});
			}
	]);

	console.log(req.body);
})
app.post('/register', function(req,res){ // Make this async
	var result = "success"; 
	tempAuth.findOne({userEmail: req.body.email}, function(err,result){
		if(res.tempID == req.body.verificationCode){
			bcrypt.genSalt(circularSalt,function(err,salt){
				bcrypt.hash(req.body.password,salt, function(err,hash){
					var user = new account({
									userEmail: req.body.email,
									password: hash,
									networkID: result.networkID,
									userType: result.userType,
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
router.get('/patientList:id:doc',function(req,res){  // Get list of Patients based off the user ID (either Patient or Manager)
	pgbae.connect(function(err, client, done){
		if(err){
			return console.error('error connecting client to pool: '+ err);
		}
		if(req.query.doc === 'true'){
			client.query('SELECT * FROM public.patients WHERE providerid = ($1)',[req.query.id], function(err,results){
				initialize(results);
				function initialize(results){
					const PatientList = [];
					getLatestInput(results, PatientList);
				}
				function getLatestInput(results, PatientList){
					var patientCount = results.rowCount;
					for(x = 0; x<patientCount;x++){
						var counter = 0;
						console.log(results.rows[counter]);
						patientEntry.find({"patientID":results.rows[x].emrid}).sort({"entryInfo": -1}).limit(1).exec(function(err,entry){
								var patient = {
									 firstName: results.rows[counter].firstname,
									 lastName: results.rows[counter].lastname,
									 vitalsbph: results.rows[counter].vitalsbph,
									 vitalsbpl: results.rows[counter].vitalsbpl,
									 vitalsalcohol: results.rows[counter].vitalsalcohol,
									 gameification: results.rows[counter].gameification,
									 patientemail: results.rows[counter].patientemail,
									 gender: results.rows[counter].gender,
									 steps: results.rows[counter].steps,
									 exercisetime: results.rows[counter].exercisetime,
									 pid: results.rows[counter].emrid,
									 provider: results.rows[counter].providername,
									 sex: results.rows[counter].gender,
									 dob: results.rows[counter].dob,
									 weight: results.rows[counter].weight,
									 lastInput: config.objectWizard(entry),
									 status: results.rows[counter].status,
									 message: results.rows[counter].convoid,
									 isFlagged: results.rows[counter].flag
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
		}
		else{
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
											 provider: results.rows[counter].providername,
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
				}
			});

	pgbae.on('error', function (err, client) {  
 		 console.error('idle client error', err.message, err.stack)
	});
});
router.post('/patient/submitData', function(req,res){   //Patient Submitting Daily Entry from their iPhone
	helper.runAnalysis(req.body).then(function(score){
		var entry = new patientEntry({
			patientID : req.body.patientID,
			entryInfo : req.body.entryInfo,
			bpHigh: req.body.bpHigh,
			bpLow:req.body.bpLow,
			weight:req.body.weight,
			exerciseTime:req.body.exerciseTime,
			alcoholIntake:req.body.alcoholIntake,
			steps: Math.round(parseInt(req.body.steps.split(' ')[0], 10)),
			averageHR: Math.round(parseFloat(req.body.averageHR.split(' ')[0], 10)*60),
			stressLevel:req.body.stressLevel,
			smoke:req.body.smoke,
			statusResults:score
		});
		entry.save(function(err){
			if(err) throw err;
			console.log('Patient Entry submitted');
		});
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
router.post('/patient/submitData/loader', function(req,res){   //Patient Submitting Daily Entry from their iPhone
	helper.runAnalysis(req.body).then(function(score){
		var entryData = new patientEntry({
			patientID : req.body.patientID,
			entryInfo : req.body.entryInfo,
			bpHigh: req.body.bpHigh,
			bpLow:req.body.bpLow,
			weight:req.body.weight,
			exerciseTime:req.body.exerciseTime,
			alcoholIntake:req.body.alcoholIntake,
			steps: req.body.steps,
			averageHR: req.body.averageHR,
			stressLevel:req.body.stressLevel,
			smoke:req.body.smoke,
			statusResults:score
		});
		entryData.save(function(err){
			if(err) throw err;
			console.log('Patient Entry submitted');
		});
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
	var sugar = bcrypt.genSaltSync(circularSalt);
	var genID = bcrypt.hashSync(req.body.data.emrid, sugar); // Used for messages
	var convo = "INSERT INTO public.messages (networkid, convoid, patientid, providerid, managerid) VALUES ('$2a$10$mm6Gn/Jw6TEmhlxtXsWQvuJV8U7AwjBE/hhz8a503Fo4xFAoEAPmC','"+genID+"','"+req.body.data.emrid+"','"+req.body.data.providerid+"','"+req.body.data.managerid+"')";
	var statement = "INSERT INTO public.patients (firstname, lastname, vitalsbph, vitalsbpl, weight, vitalsalcohol, status, managerid, convoid, emrid, patientemail, gender, flag, steps, exercisetime, gameification,providerid,networkid) VALUES " +
				"('" + req.body.data.firstname + 
				"','" +req.body.data.lastname +
				"','" +req.body.data.vitalsbph +
				"','" +req.body.data.vitalsbpl +
				"','" +req.body.data.weight +
				"','" +req.body.data.vitalsalcohol +
				"','" +req.body.data.status +
				"','" +req.body.data.managerid +
				"','" +genID +
				"','" +req.body.data.emrid +
				"','" +req.body.data.patientemail + 
				"','" +req.body.data.gender +
				"','" +"false"+
				"','" +req.body.data.steps +
				"','" +req.body.data.exercisetime +
				"','0','" + req.body.data.providerid +
				"','$2a$10$mm6Gn/Jw6TEmhlxtXsWQvuJV8U7AwjBE/hhz8a503Fo4xFAoEAPmC"+"')";
	var regVal = Math.floor(Math.random()*90000) + 10000;			
	new tempAuth({
		userEmail: req.body.data.patientEmail,
		tempID: regVal,
		networkID: '$2a$10$mm6Gn/Jw6TEmhlxtXsWQvuJV8U7AwjBE/hhz8a503Fo4xFAoEAPmC',
		userType: 'Patient'
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
		client.query('SELECT lastname FROM public.employees WHERE providerid = ($1)', [req.body.providerid], function(err,result){
			if(err) throw err;
			client.query('UPDATE public.patients SET providername = ($1) WHERE emrid = ($2)',[result.rows[0].lastname, req.body.emrid], function(err,final){
				if(err) throw err;
				console.log('party');
			})
		})
		res.status(200).json("Patient Added Successfully"); 
		client.release(); 
	});   

	const mailOptions = {
	    from: '"HeartLink Registration" <heartlinkucf@gmail.com>', // sender address
	    to: req.body.patientEmail, // list of receivers
	    subject: 'Welcome to HeartLink', // Subject line
	    text: 'Hello and Welcome to HeartLink! Please use Registration Code '+regVal+' to create an account. ', // plaintext body
	    html: '<b>Hello and Welcome to HeartLink! Please use Registration Code'+regVal+' to create an account.</b>' // html body
	};

	transporter.sendMail(mailOptions, function(error, info){
	    if(error){
	        return console.log(error);
	    }
	    console.log('Message sent: ' + info.response);
	});
});
router.post('/patients/update', function(req,res){ // Update a Patient from Web Portal
	pgbae.connect(function(err,client,done){
		client.query('UPDATE public.patients SET vitalsbph = ($1), vitalsbpl = ($2), weight = ($3), vitalsalcohol = ($4), managerid = ($5), patientEmail = ($6), steps = ($7), exercisetime = ($8), providerid = ($9), dob = ($10), firstname = ($11), lastname = ($12), gender($13) WHERE emrid = ($14)',
			[req.body.data.vitalsbph, req.body.data.vitalsbpl, req.body.data.vitalsweight, req.body.data.vitalsalcohol, req.body.data.managerid, req.body.data.patientemail, req.body.data.steps, req.body.data.exercise, req.body.data.providerid, req.body.data.dob, req.body.data.firstname, req.body.data.lastname, req.body.data.gender, req.body.data.emrid],
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
router.post('/patients/flag', function(req,res){
	pgbae.query('UPDATE public.patients SET flag = NOT flag WHERE emrid = ($1)',[req.body.id]);
	res.sendStatus(200);
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
app.get('/average',function(req,res){
	var heartRateArray = [];
	var stressLevelArr = [];
	var stepsArr = [];
	var exerciseTimeArr = [];
	var weightArr = []; 
	var bpLowArr = []; 
	var bpHighArr = [];

	
	//Smoke Arr?
	patientEntry.find({$where: function () { return Date.now() - this._id.getTimestamp() < (24 * 60 * 60 * 1000)  }}, function(err,docs){
		for(x = 0; x<docs.length; x++){
			heartRateArray.push(docs[x].averageHR);
			stressLevelArr.push(docs[x].stressLevel);
			stepsArr.push(docs[x].steps);
			exerciseTimeArr.push(docs[x].exerciseTime);
			weightArr.push(docs[x].weight);
			bpLowArr.push(docs[x].bpLow);
			bpHighArr.push(docs[x].bpHigh);
		}
		var averagePatient = { 
			heartRate:  heartRateArray.reduce((a, b) => a + b, 0)/heartRateArray.length,
			stressLevel: stressLevelArr.reduce((a, b) => a + b, 0)/stressLevelArr.length,
			steps: stepsArr.reduce((a, b) => a + b, 0)/stepsArr.length,
			exerciseTime: exerciseTimeArr.reduce((a, b) => a + b, 0)/exerciseTimeArr.length, 
			weight: weightArr.reduce((a, b) => a + b, 0)/weightArr.length, 
			bpLow: bpLowArr.reduce((a, b) => a + b, 0)/bpLowArr.length,
			bpHigh: bpHighArr.reduce((a, b) => a + b, 0)/bpHighArr.length
		};
		res.json(averagePatient);
	});
});
//-------------------------------------------|
// Message System Routes					 |
//-------------------------------------------|
router.post('/messages/patient/send',function(req,res){ 
	pgbae.connect(function(err,client,done){
		if(err){
			console.log('message posted error');
		}
		client.query('SELECT convoid FROM public.patients WHERE emrid = ($1)',[req.body.emrid], function(err,result){
			client.query('INSERT INTO public.messagecontent (convoid,message,messengerid,timestamp) VALUES ($1,$2,$3,$4)',[result.rows[0].convoid, req.body.message, req.body.emrid, moment().format()]);
		});
	});
	res.status(200).json("Message Posted");	
});
router.post('/messages/id',function(req,res){  // Send a Message from Web Portal
 	pgbae.connect(function(err,client,done){
		if(err){
			console.log('message posted error');
		}
		client.query('SELECT convoid FROM public.patients WHERE emrid = ($1)',[req.body.id], function(err,result){
			client.query('INSERT INTO public.messagecontent1 (convoid,message,messengerid,timestamp) VALUES ($1,$2,$3,$4)',[result.rows[0].convoid, req.body.message, req.body.messenger, moment().format()],function(err,result1){
				if(err) throw err;	
			});
		});
	});

	
	res.status(200).json("Message Posted");	
});
router.post('/messages',function(req,res){ // Get a conversation with a patient
		async.waterfall(
			[
				function getConversationID(callback){
						pgbae.connect(function(err,client,done){
							if(err){
								console.log('get Message error: '+ err)
							}
							var conversationID;
							client.query("SELECT * FROM public.messages WHERE patientid = ($1)",[req.body.id],function(err,res){
								if(err) throw err; 
								return callback(null,res.rows[0].convoid,res.rows[0]);
							});
							client.release();
						});
					},
				function getMessages(convoID, idValues, callback){
						console.log(idValues);
		 			 	pgbae.connect(function(err,client,done){
						 	if(err){
						 		console.log('get Message error: '+ err)
						 	}
						 	var message = [];
						 	message.push(callback);
						 	client.query("SELECT * FROM public.messagecontent WHERE convoid = ($1)",[convoID],function(err,data){
						 		var newFormat = helper.formatMessages(idValues, data.rows);
						 		res.json(newFormat);
						 	});
						 	client.release();
						 });
				}
			]
		);
});
router.get('/messages/mobile:id:token',function(req,res){ // Get a conversation with a patient
		async.waterfall(
			[
				function getConversationID(callback){
						pgbae.connect(function(err,client,done){
							if(err){
								console.log('get Message error: '+ err)
							}
							var conversationID;
							client.query("SELECT * FROM public.messages WHERE patientid = ($1)",[req.query.id],function(err,res){
								if(err) throw err; 
								return callback(null,res.rows[0].convoid,res.rows[0]);
							});
							client.release();
						});
					},
				function getMessages(convoID, idValues, callback){
						console.log(idValues);
		 			 	pgbae.connect(function(err,client,done){
						 	if(err){
						 		console.log('get Message error: '+ err)
						 	}
						 	var message = [];
						 	message.push(callback);
						 	client.query("SELECT * FROM public.messagecontent WHERE convoid = ($1)",[convoID],function(err,data){
						 		var newFormat = helper.formatMessages(idValues, data.rows);
						 		res.json(newFormat);
						 	});
						 	client.release();
						 });
				}
			]
		);
});
router.post('/messages/mobile',function(req,res){ // Get a conversation with a patient
		/* 1. Use EMR ID  to get conversation ID from public.messages
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
							client.query("SELECT * FROM public.messages WHERE patientid = ($1)",[req.body.emrID],function(err,result){
								return callback(null,result.rows[0].convoid);
							});
							client.release();
						});
					},
				function getMessages(convoID,callback){
		 			 	pgbae.connect(function(err,client,done){
						 	if(err){
						 		console.log('get Message error: '+ err)
						 	}
						 	client.query("SELECT * FROM public.messagecontent WHERE convoid = ($1)",[convoID],function(err,data){
						 		res.json(data.rows); 
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
});
app.get('/',function(req,res){
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
