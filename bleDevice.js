const SerialPort = require("serialport");
const Readline = require("@serialport/parser-readline");
const { DateTime } = require("luxon");

class BleDevice {

  logPrefix = `[BLESH]`
  debug = true;
  printUnfilteredData = false
  currentId = 0;
  prefix_logger = undefined;
  portName = undefined;
  parser = undefined;
  port = undefined;
  address = undefined;

  constructor() {

  }

  usbDiscovery() {
    SerialPort.list().then(function (ports) {
      ports.forEach(function (port) {
        this.logDebug("Port: ", port);
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

    this.requestAddress();
  }

  /**
   * Specific serial message in order to receive a message with the local address on the mesh
   */
  requestAddress() {
    this.port.write(`chat status\n`)
    setTimeout(() => {
      this.port.write(`chat status\n`)
    }, 200)
  }

  sendMessage(msg, fun) {
    let test = `01100110011001100011010000110101`;
    //const toSend = test
    const msgId = this.currentId
    const toSend = msgId + '*' + msg;
    this.logDebug(`sending message in broadcast: size = ${toSend.length} ${toSend}`);
    this.port.write(`chat msg "${toSend}"\n`);
    this.generateNextId();
    fun(`snd ${msgId} ${this.address} ${toSend.length} ${DateTime.now().toMillis()}`);

  }
  sendUnicastMessage(msg, fun, address) {

    const msgId = this.currentId
    const toSend = msgId + '*' + msg;
    this.logDebug(`sending message unicast ${address}: size = ${toSend.length} ${toSend}`);
    this.port.write(`chat private ${address} "${toSend}"\n`);
    this.generateNextId();
    fun(`snd ${msgId} ${this.address} ${toSend.length} ${DateTime.now().toMillis()}`);
  }
  onReceiveMessage(fun) {
    this.parser.on("data", async (data) => { // "<0x0033> -57: 1*hey b*pl"
      if(this.printUnfilteredData){
        this.logDebug(data);
      }
      
   


      if (data.includes("addr") && this.address == undefined) {
        this.address = data.split("addr ")[1]
        this.logDebug(`Found local mesh address: ${this.address}`);
        return
      }
      let type = undefined
      let filtered = undefined;
      let tempType = data.split("<")[0]

      if(tempType.includes("rcv")){
        filtered = data.split("rcv")[1]
        type = 'rcv'
      }

      if(tempType.includes("rcv_unicast")){
        filtered = data.split("rcv_unicast")[1]
        type = 'rcv_unicast'
      }

      if (type !== undefined) {
        // @TODO better. shitty chars
        this.logDebug(`${type}: ` + filtered)

        data = filtered;
        //data = data.substring(0,2)

        const splittedDataArray = data.split("*")  // [ '<0x0033> -57: 1', 'hey b', 'pl' ]
        let header = splittedDataArray[0] // <0x0033> -57: 1
        let id = header.split(":")[1].substring(1)
        let address = header.split(":")[0].split(" ")[0]
        let rssi = header.split(":")[0].split(" ")[1]

        let messageInfo = {
          header : splittedDataArray[0],
          id: header.split(":")[1].substring(1),
          sender: header.split(":")[0].split(" ")[0],
          rssi: header.split(":")[0].split(" ")[1]
        }
        let payload = data.substring(header.length + 1);

        /* type:rcv/snd id mac_address rssi len_data timestamp*/
        let to_string = `rcv ${id} ${address} ${rssi} ${data.length} ${DateTime.now().toMillis()}`
        fun(data.substring(header.length + 1), messageInfo, to_string);
      } // +1 for removing the '*' separator char from the message
    });
  }

  generateNextId() {
    this.currentId = (this.currentId + 1) % 9999 // Ensure that the ID will restart if it try to reach 5 chars utf-8. 
  }
  logDebug(data){
    if(this.debug){
      console.log(`${this.logPrefix} ${data}`);
    }
  }
}


module.exports = new BleDevice(); // modules cache system, basically only one instance will be created.
