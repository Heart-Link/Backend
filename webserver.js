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

router.get('/patients',function(req,res){  // Get list of Patients
	pgbae.connect(function(err, client, done){
		if(err){
			return console.error('error connecting client to pool: '+ err);
		}
		var statement = "SELECT * FROM public.network (networkName) VALUES ('Orlando Health')";
		client.query(statement,function(err,result){
			if(err){
				console.log(err);
			};
		});

	});
});


/* 
step 1: make conversation, generate patientID and save the convoID
step 2: make patient and input information
step 3: save all 
step 4: pray 

Notes: GenID is for messages, using EMRID for all patient ID needs
*/

router.post('/patients/create', function(req,res){
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
	console.log(convo);
	console.log(statement);

	pgbae.connect(function(err,client,done){
		if(err){
			return console.error('error connecting client to pool: '+ err);
		}
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

router.get('patients:id',function(req,res){ // get Individual Patient Information
	var patientID = req.query.id; //EMRID
	var results = pgbae.query('SELECT * FROM public.patients WHERE emrid == '+patientID+"'");
	console.log(results);
});

router.post('/patients/id',function(req,res){ // Update individual patient information

});

router.delete('/patients/delete/id',function(req,res){ // delete patient number ID

});

router.post('/patients/notes/id',function(req,res){ // update notes chart 

});

router.get('/patients/collect', function(req,res){ // get new data from devices

});


//-------------------------------------------|
// Message System Routes					 |
// 											 |
// 											 |
// 											 |
//-------------------------------------------|

router.get('/messages/conversationid',function(req,res){

});

router.post('/messages/id',function(req,res){
 	/* 
 	1. get Message and messenger ID and timestamp 
 	2. create Json Entry
 	3. find message row from PostgreSQL by using Patient ID in messages Table
 	4. append json entry */

 	var json = {
 		"messenger": req.body.messengerID,
 		"message": req.body.message, 
 		"time": 'NOW'
 	}

 	pgbae.connect(function(err, client, done){
 		if(err){
 			console.log('message Post Err: '+err); 
 		}
 		var statement = "INSERT INTO public.messages (messageInformation) VALUES ('"+JSON.stringify(json)+"') WHERE patientid ='"+ req.body.patientID+ "'";
 		console.log(statement);
 		client.query(statement, function(err,result){
 			if(err){
 				console.log(err); 
 			}
 			else{
 				console.log('Message Successfully Appended'); 
 			}
 		});
 	});
});

router.delete('/messages/id',function(req,res){

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
