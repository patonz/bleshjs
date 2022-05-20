const BleDevice = require('./bleDevice')


BleDevice.connect('/dev/ttyACM0');
BleDevice.printUnfilteredData = false



BleDevice.onReceiveMessage((payload, info)=>{
    console.log(payload);
    console.log(info);

})

setInterval(() => {
    BleDevice.sendUnicastMessage('test message', (log)=>{
        console.log(log)
    }, '0xFFFF');
}, 5000);
