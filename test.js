const BleDevice = require('./bleDevice')


<<<<<<< HEAD
BleDevice.connect('/dev/ttyUSB0');
=======
BleDevice.connect('/dev/ttyACM0');
BleDevice.printUnfilteredData = false

>>>>>>> 662ddbd865da25b690e278ea4f9bf720a2591dcc


BleDevice.onReceiveMessage((payload, info)=>{
    console.log(payload);
    console.log(info);

})

setInterval(() => {
    BleDevice.sendUnicastMessage('ciaone1', (log)=>{
        console.log(log)
    }, '0xC001');
}, 200);
