/*** EXAMPLE of using ether-frame package with PCAPNGParser to decode ethernet packet ***/
/*** Link to ether-frame package: https://www.npmjs.com/package/ether-frame ***/

const PCAPNGParser = require('../src/PCAPNGParser')
const pcapNgParser = new PCAPNGParser()
// const myFileStream = process.stdin // pipe from tcpdump
const myFileStream = require('fs').createReadStream('./examples/res/myfile.pcapng')
const EtherFrame = require('ether-frame')

myFileStream
    .pipe(pcapNgParser)
    .on('data', parsedPacket => {
        console.log(parsedPacket)
        try {
            console.log(EtherFrame.fromBuffer(parsedPacket.data, pcapNgParser.endianess))
        } catch(ex) {
            // Catches for type codes not currently supported by ether-frame
            console.log(ex.message)
        }
    })
    .on('interface', interfaceInfo => {
        console.log(interfaceInfo)
    })

