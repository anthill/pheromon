
# Unitary Tests for Pheromon

26 tests are available for now.

## Database API
 
1. Current Measurements
2. Get Place Measurements Single
3. Get Place Measurements Multiple
4. Get Sensor Measurements Single
5. Get Sensor Measurements Multiple

6. Place creation
7. Place update
8. Place deletion
9. All places deletion
10. Place get
11. All places get

12. Sensor creation
13. Sensor update
14. Sensor deletion
15. All sensors deletion
16. Sensor get
17. All sensors get

  ## Broker
  
18. Broker should not authenticate sensor with fake token

  ## Maestro utils
  
  `checkSensor` is a utility function of maestro. `checkSensor` checks if the sensor that sent a message is known in the database, and if not, creates it.

19. `checkSensor` should register unknown sensor
20. `checkSensor` should not register known sensor
21. `checkSensor` should not add already existing output

  ## Maestro
  
  Tests to verify complete maestro functionality, from sensor message to maestro response.

22. Maestro should register unknown sensor
23. Maestro should send back init command when asked
24. Maestro should register sensor status update in DB
25. Pushing wifi measurements
26. Emitting commands through socket should send command to sensors
