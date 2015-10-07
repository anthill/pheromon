
## Available commands

- `status` to ask the sensor status
- `reboot` to reboot your sensor
- `pauserecord` to pause the recording
- `resumerecord` to resume the recording
- `changestarttime 10` to change the measurement start time to 10:00 (24h time)
- `changestoptime 19` to change the measurement start time to 19:00 (24h time)
- `changeperiod 60` to change the measurement period to 60 seconds
- `date dateString` to change the date time of your sensor to `dateString`
- `openTunnel yourServerSSHport sensorSSHport yourServerName` to open a reverse SSH tunnel between your server and the sensor.
- `closetunnel` to close the SSH tunnel
- `init period startTime stopTime dateString` to initialize the sensor with correct parameters