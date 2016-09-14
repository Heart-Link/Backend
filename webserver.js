const express = require('express');
const bodyparser = require('body-parser');
const bcrypt = require('bcrypt');
const circularSalt = 10;
const pg = require('pg');
const Pool = require('pg').Pool; 
const url = require('url');
const moment = require('moment'); 
const app = express(); 
const router = express.Router();
const async = require('async');

app.use(bodyparser.urlencoded({ extended: true}));
app.use(bodyparser.json());
var port = process.env.PORT || 8080;

app.use('/',function(req,res,next){
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "X-Requested-With, Content-Type, Accept");
	next();
});

// ------------- include Models -------------------

const patientEntry = require('./models/patientSchema.js'); 

const databaseURL = 'seniordesign.ceweg4niv3za.us-east-1.rds.amazonaws.com';
var pgbae = new Pool({
	user: 'sagar',
	database: 'patientNetwork',
	password: 'mistryohsd',
	host: databaseURL,
	port: 5432,
	max: 10,
	idleTimeoutMillis: 30000
});


router.get('/',function(req,res){
	res.json({ message: 'test Message'});
});

//-------------------------------------------|
//-------------------------------------------|
//------------User Authentication------------|
//-------------------------------------------|
//-------------------------------------------|


app.get('/login:email:password', function(req,res){
	var userEmail = req.query.email;
	var userPW = req.query.password;

	person.findOne({ email: userEmail },function(err,record){
		 bcrypt.compare(userPW, record.password, function(err,success){
		 	if(success){
		 		console.log("Access Granted");
		 	}
		 	else{
		 		console.log(err);
		 	}
		 })
	});
});

router.get('/logout', function(req,res){

});

router.get('/user/me',function(req,res){  // validate Session Token for web services
	
});


//-------------------------------------------|
// Patient System Routes					 |
// 											 |
// 											 |
// 											 |
//-------------------------------------------|

router.get('/patientList:id',function(req,res){  // Get list of Patients
	pgbae.connect(function(err, client, done){
		if(err){
			return console.error('error connecting client to pool: '+ err);
		}
		client.query('SELECT * FROM public.patients WHERE managerid = ($1)',[req.query.id], function(err,results){
				res.send(results);

		});

	});
});




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
// 											 |
// 											 |
// 											 |
//-------------------------------------------|


router.post('/messages/id',function(req,res){
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
 	});
});
 
router.get('/messages:patient',function(req,res){
		/* 1. Use EMR ID (passed by Req.query) to get conversation ID from public.messages
			2. Get all messages from public.messagecontent with conversationID
			3. SORT BY MOST RECENT DATE */
		console.log(req.query.patient);
		pgbae.connect(function(err,client,done){
			if(err){
				console.log('get Message error: '+ err)
			}
			var conversationID; 
			var statement = "SELECT convoid FROM public.messages WHERE patientid ="+req.query.patient+"::text";

			client.query(statement,function(err,res){
				console.log(res.rows[0].convoid);
				client.query("SELECT * FROM public.messagecontent WHERE convoid = ($1)",[res.rows[0].convoid],function(err,data){
					res.send(data);
				 });
		});
	});
});
//-------------------------------------------|
// patient network stuff 					 |
// 											 |
// 											 |
// 											 |
//-------------------------------------------|

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
	        });
	    });
	});
});




//Register routes with a prefix for the API 
app.use('/api',router);
app.listen(port);
console.log('The Party is on port '+ port);
