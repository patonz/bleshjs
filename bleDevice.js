const SerialPort = require("serialport");
const Readline = require("@serialport/parser-readline");
const { DateTime } = require("luxon");

class BleDevice {

  currentId = 0;
  prefix_logger = undefined;
  portName = undefined;
  parser = undefined;
  port = undefined;

  constructor() {
    
  }

  usbDiscovery() {
    SerialPort.list().then(function (ports) {
      ports.forEach(function (port) {
        console.log("Port: ", port);
      });
    });
  }

  connect(port_input) {
    this.portName = port_input;
    this.port = new SerialPort(this.portName, {
      baudRate: 115200,
      dataBits: 8,
      stopBits: 1,
      parity: "none",
      rtscts: false,
    });

    this.parser = this.port.pipe(new Readline({ delimiter: "\r\n" }));
    this.port.on("readable", () => {
      this.port.read();
    });
  }

  sendMessage(msg, fun) {
    let test = `01100110011001100011010000110101`;
    //const toSend = test
    const msgId = this.currentId
    const toSend = msgId + '*' + msg;
    console.log(`sending message in broadcast: size = ${toSend.length} ${toSend}`);
    this.port.write(`chat msg "${toSend}"\n`);
    this.generateNextId();
    fun(`snd`);

   
    
  }
  onReceiveMessage(fun) {
    this.parser.on("data", async (data) => { // "<0x0033> -57: 1*hey b*pl"
      
      if(!data.includes("rcv")){
        return
      }
      let filtered = data.split("rcv")[1] // @TODO better. shitty chars
      console.log("filtered: " +filtered)
      console.log("norm : "+data)

      data = filtered;
      //data = data.substring(0,2)
      
      const splittedDataArray = data.split("*")  // [ '<0x0033> -57: 1', 'hey b', 'pl' ]
      let header = splittedDataArray[0] // <0x0033> -57: 1
      let id = header.split(":")[1].substring(1)
      let address = header.split(":")[0].split(" ")[0]
      let rssi = header.split(":")[0].split(" ")[1]

      /* type:rcv/snd id mac_address rssi len_data timestamp*/
      let to_string = `rcv ${id} ${address} ${rssi} ${data.length} ${DateTime.now().toMillis()}`
      fun(data.substring(header.length+1), to_string); // +1 for removing the '*' separator char from the message
    });
  }

  generateNextId(){
    this.currentId = (this.currentId + 1) % 9999 // Ensure that the ID will restart if it try to reach 5 chars utf-8. 
  }
}
module.exports = new BleDevice(); // modules cache system, basically only one instance will be created.
