
# Unitary Tests for Pheromon

21 tests are available for now.

## Database API
  
1. Place creation
2. Place update
3. Place deletion
4. All places deletion
5. Place get
6. All places get

7. Sensor creation
8. Sensor update
9. Sensor deletion
10. All sensors deletion
11. Sensor get
12. All sensors get

  ## Broker
  
13. Broker should not authenticate sensor with fake token
14. Broker should send message on status/ topic when a client disconnects

  ## Maestro utils
  
  `checkSensor` is a utility function of maestro. `checkSensor` checks if the sensor that sent a message is known in the database, and if not, creates it.

15. `checkSensor` should register unknown sensor
16. `checkSensor` should not register known sensor

  ## Maestro
  
  Tests to verify complete maestro functionality, from sensor message to maestro response.

17. Maestro should register unknown sensor
18. Maestro should send back init command when asked
19. Maestro should register sensor status update in DB
20. Pushing wifi measurements
21. Emitting commands through socket should send command to sensors
