import requests
from random import randint
import random


userId = input("user ID?")
y = input("Number of records");

for number in range(1,y+1):
	record = requests.post('http://ec2-54-163-104-129.compute-1.amazonaws.com:8080/api/patient/submitData/loader', data ={
		'patientID': userId,
		'entryInfo': '2016-10-'+str(number)+'T15:14:52-04:00',
		'bpHigh': randint(116,130),
		'bpLow': randint(68,90),
		'weight': randint(170, 185),
		'exerciseTime': randint(0,100),
		'alcoholIntake':randint(0,5),
		'steps':randint(1000,5000),
		'averageHR':randint(58,70),
		'stressLevel':randint(1,8),
		'smoke': bool(random.getrandbits(1)),  
		'token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyIkX18iOnsic3RyaWN0TW9kZSI6dHJ1ZSwiZ2V0dGVycyI6e30sIndhc1BvcHVsYXRlZCI6ZmFsc2UsImFjdGl2ZVBhdGhzIjp7InBhdGhzIjp7Il9fdiI6ImluaXQiLCJkZXZpY2VJRCI6ImluaXQiLCJ1c2VyVHlwZSI6ImluaXQiLCJwYXNzd29yZCI6ImluaXQiLCJ1c2VyRW1haWwiOiJpbml0IiwiX2lkIjoiaW5pdCJ9LCJzdGF0ZXMiOnsiaWdub3JlIjp7fSwiZGVmYXVsdCI6e30sImluaXQiOnsiX192Ijp0cnVlLCJkZXZpY2VJRCI6dHJ1ZSwidXNlclR5cGUiOnRydWUsInBhc3N3b3JkIjp0cnVlLCJ1c2VyRW1haWwiOnRydWUsIl9pZCI6dHJ1ZX0sIm1vZGlmeSI6e30sInJlcXVpcmUiOnt9fSwic3RhdGVOYW1lcyI6WyJyZXF1aXJlIiwibW9kaWZ5IiwiaW5pdCIsImRlZmF1bHQiLCJpZ25vcmUiXX0sImVtaXR0ZXIiOnsiZG9tYWluIjpudWxsLCJfZXZlbnRzIjp7fSwiX2V2ZW50c0NvdW50IjowLCJfbWF4TGlzdGVuZXJzIjowfX0sImlzTmV3IjpmYWxzZSwiX2RvYyI6eyJfX3YiOjAsImRldmljZUlEIjoiTmFoQ2hpbGwiLCJ1c2VyVHlwZSI6IlByb3ZpZGVyIiwicGFzc3dvcmQiOiIkMmEkMTAkLlNzcnlFMHlPb2RVQ0R4U1BqSWc5ZVc2WHAyWEd3bkFWNkZlT0ouVy5yclFyazIwMkh0ZEsiLCJ1c2VyRW1haWwiOiJhc2RmIiwiX2lkIjoiNTgxMGQwODZlOTVjMjkxYWZmMTZiYzI1In0sIl9wcmVzIjp7IiRfX29yaWdpbmFsX3NhdmUiOltudWxsLG51bGxdLCIkX19vcmlnaW5hbF9yZW1vdmUiOltudWxsXX0sIl9wb3N0cyI6eyIkX19vcmlnaW5hbF9zYXZlIjpbXSwiJF9fb3JpZ2luYWxfcmVtb3ZlIjpbXX0sImlhdCI6MTQ3OTc2MDkwNiwiZXhwIjoxNDc5ODQ3MzA2fQ.t1JH_UoGDSxbTRNn4mqkL8qtZKAk5BIXvCV36SZaJYA'
		})
