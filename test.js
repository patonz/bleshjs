const BleDevice = require('./bleDevice')


BleDevice.connect('/dev/ttyACM0');


BleDevice.onReceiveMessage((payload, info)=>{
    console.log(payload);
    console.log(info);

})