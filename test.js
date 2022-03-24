const BleDevice = require('./bleDevice')


BleDevice.connect('/dev/ttyACM0');
BleDevice.printUnfilteredData = false



BleDevice.onReceiveMessage((payload, info)=>{
    console.log(payload);
    console.log(info);

})

setInterval(() => {
    BleDevice.sendUnicastMessage('ciaone1', (log)=>{
        console.log(log)
    }, '0xC001');
}, 200);
