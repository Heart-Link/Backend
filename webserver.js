var express = require('express');
var bodyparser = require('body-parser');
var bcrypt = require('bcrypt');
const pg = require('pg');
const Pool = require('pg').Pool;
const url = require('url');
var app = express(); 
var router = express.Router();

app.use(bodyparser.urlencoded({ extended: true}));
app.use(bodyparser.json());
var port = process.env.PORT || 8080;


// ------------- include Models -------------------

//const patient = require('./models/patientSchema.js'); 

const databaseURL = 'seniordesign.ceweg4niv3za.us-east-1.rds.amazonaws.com';


var bae = new Pool({
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
// Helper Routes							 |
// 											 |
// 											 |
// 											 |
//-------------------------------------------|

router.get('/user/managers',function(req,res){

});

router.get('/user/doctors',function(req,res){

});

router.post('/push', function(req,res){

});

//-------------------------------------------|
// Patient System Routes					 |
// 											 |
// 											 |
// 											 |
//-------------------------------------------|

router.get('/patients',function(req,res){  // Get list of Patients
	bae.connect(function(err, client, done){
		if(err){
			return console.error('error connecting client to pool: '+ err);
		}
		var statement = "INSERT INTO public.network (networkName) VALUES ('Orlando Health')";
		client.query(statement,function(err,result){
			if(err){
				console.log(err);
			}
			else{
				console.log("we gucci mane"); 
			}
		});

	});
});

router.get('patients/id',function(req,res){ // get Individual Patient Information

});

router.post('/patients/id',function(req,res){ // Update individual patient information

});

// router.post('/patients/record',function(req,res){ // Patient Record Submission
// 	var person = new patient({ 
// 		firstName : req.body.firstName, 
// 		lastName : req.body.lastName, 
// 		foodServings :{
// 			redMeat : req.body.redMeat,
// 			whiteMeat : req.body.whiteMeat,
// 			fish : req.body.fish, 
// 			vegetables : req.body.vegetables, 
// 			fruit : req.body.fruit,
// 			grain : req.body.grain,
// 			sweets : req.body.sweets,
// 			soda : req.body.soda,
// 			water : req.body.water
// 		},
// 		sexualActivity : req.body.sex,
// 		stressLevel : req.body.stress, 
// 		recommendedVitals : {
// 			bloodPressureHigh : req.body.bpHigh,
// 			bloodPressureLow : req.body.bpLow,
// 			weight : req.body.weight,
// 			alcoholIntake : req.body.alcohol,
// 			smoke : req.body.smoke
// 		},
// 		status : req.body.status // <----- What is this? 
// 		providerID : req.body.providerID,
// 		managerID : req.body.managerID, 
// 		conversationID :  // <---- Add SQL DB ID
// 		healthFlag : req.body.healthFlag // <---- what is this?
// 	});
// 	person.save(function(err,res){
// 		if(err){
// 			console.log(err);
// 		}
// 	});


// 	// Add create Message with Provider, manager and patient. 

// 	//
// });


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

});


//Register routes with a prefix for the API 
app.use('/api',router);
app.listen(port);
console.log('The Party is on port '+ port);
