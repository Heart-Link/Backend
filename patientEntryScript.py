import requests
from random import randint


userId = input("user ID?")
y = input("Number of records");

for num in range(1,y+1):
	record = requests.post('http://ec2-54-163-104-129.compute-1.amazonaws.com:8080/api/patient/submitData', data ={
		'patientID': userId,
		'bpHigh': randint(116,130),
		'bpLow': randint(68,90),
		'weight': randint(100, 120),
		'exerciseTime': randint(0,100),
		'alcoholIntake':randint(0,5),
		'steps':randint(1000,5000),
		'averageHR':randint(58,70),
		'stressLevel':randint(1,8),
		'smoke': bool(random.getrandbits(1)),
        'date': '2016-10-'+str(num)+'T15:14:52-04:00'
                           
	})
