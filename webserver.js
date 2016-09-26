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

//const jwt = require('jsonwebtoken');

app.use(bodyparser.urlencoded({ extended: true}));
app.use(bodyparser.json());
app.set('secret',config.secret);

var port = process.env.PORT || 8080;

app.use('/',function(req,res,next){
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "X-Requested-With, Content-Type, Accept");
	next();
});

// ------------- include Models -------------------

const patientEntry = require('./models/patientEntry.js'); 

const databaseURL = 'seniordesign.ceweg4niv3za.us-east-1.rds.amazonaws.com';
const pgbae = new Pool({
	user: 'sagar',
	database: 'patientNetwork',
	password: 'mistryohsd',
	host: databaseURL,
	port: 5432,
	max: 10,
	idleTimeoutMillis: 50
});
mongoose.connect('mongodb://mongobot:heartlink@ec2-54-163-104-129.compute-1.amazonaws.com:27017/heartlink');
router.get('/',function(req,res){
	res.json({ message: 'API Granted'});
});

//-------------------------------------------|
//-------------------------------------------|
//------------User Authentication------------|
//-------------------------------------------|
//-------------------------------------------|


router.get('/login:email:password', function(req,res){
	var userEmail = req.query.email;
	var userPW = req.query.password;

	person.findOne({ email: userEmail },function(err,record){
		 bcrypt.compare(userPW, record.password, function(err,success){
		 	if(success){
		 		var token = jwt.sign(record, app.get('secret'),{
		 			expiresInMinutes: 1440
		 		});
		 		res.json({
		 			success: true,
		 			token: token
		 		});
		 	}
		 	else{
		 		console.log('Login error: '+err);
		 	}
		 })
	});
});

app.get('/logout', function(req,res){

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
				res.status(200).json(config.sortPatients(results));
		});
		client.release();
	});
	pgbae.on('error', function (err, client) {  
 		 console.error('idle client error', err.message, err.stack)
	})

});

router.post('/patient/submit', function(req,res){
	var entry = new patientEntry({
		patientID : req.body.patientID,
		recommendedVitals:{
			bpHigh: req.body.bpHigh,
			bpLow:req.body.bpLow,
			weight:req.body.weight,
			exerciseTime:req.body.exerciseTime,
			alcoholIntake:req.body.booze,
			steps:req.body.steps,
			averageHR:req.body.hr,
			stressLevel:req.body.stressLevel
		}
	})
	entry.save(function(err){
		if(err) throw err;
		console.log('Patient Entry submitted');
	})
	pgbae.connect(function(err,client,done){
		client.query('UPDATE public.patients SET gameification = gameification + 1 WHERE emrid = ($1)',[req.body.patientID],function(err,res){
			if(err) throw err;
			console.log(res);
		});
		client.release();
	});
})

router.post('/patients/create', function(req,res){
	/* 
		step 1: make conversation, generate patientID and save the convoID
		step 2: make patient and input information
		step 3: save all 
		step 4: pray 

		Notes: GenID is for messages, using EMRID for all patient ID needs
		*/


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

	pgbae.connect(function(err,client,done){
		if(err){
			return console.error('error connecting client to pool: '+ err);
		}
		var providerName,
			mangerName;

		client.query(convo, function(err,result){ // SEND create Message Command
			if(err){
				console.log('error: '+err);
			}
			else{
				console.log('success in conversation creation'); 
			}
		});
		client.query(statement,function(err,result){ // send Create Patient Command
			if(err){
				console.log('error: '+err);
			}
			else{
				console.log('success in Patient Creation');
			}
		});
	});
});

router.get('patients/individual:id',function(req,res){ // get Individual Patient Information
	var patientID = req.query.id; //EMRID
	var results = pgbae.query('SELECT * FROM public.patients WHERE emrid == '+patientID+"'");
	console.log(results);
});


//-------------------------------------------|
// Message System Routes					 |
//-------------------------------------------|

router.post('/messages/patient/send',function(req,res){ //iPhone app appending message to patient.
	
});


router.post('/messages/id',function(req,res){  // Appending messages to a converstaion
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
	         		console.log('cantconnect: '+err);
	         	}
	        	else{
	        		console.log('worked');
	        	}
	        	client.query("INSERT INTO public.network (networkid, networkname) VALUES ('"+hash+"','"+req.body.networkname+"')");
	        	done();
	        	client.release();
	        });
	    });
	});
});

//Register routes with a prefix for the API 
app.use('/api',router);
app.listen(port);
console.log('The Party is on port '+ port);
