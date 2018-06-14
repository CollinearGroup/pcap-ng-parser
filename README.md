# Overview
PCAP-NG-Parser is a stream-based module to decode, print and analyze network traffic packets. With this module, you can read from an existing .pcapng file or connect it to an active stream. PCAP-NG-Parser is currently in active development. At this time, it supports only ethernet protocols from the output of [TCPDump v. 4.9.2](http://www.tcpdump.org/). 

# Why capture packets in JavaScript

Excerpt from:
<https://github.com/node-pcap/node_pcap>

```
There are already many tools for capturing, decoding, and analyzing packets.  Many of them are thoroughly
tested and very fast.  Why would anybody want to do such low level things like packet capture and analysis
in JavaScript?  A few reasons:

* JavaScript makes writing event-based programs very natural.  Each packet that is captured generates an
event, and as higher level protocols are decoded, they might generate events as well.  Writing code to handle
these events is much easier and more readable with anonymous functions and closures.

* Node makes handling binary data in JavaScript fast and efficient with its Buffer class.  Decoding packets involves
a lot of binary slicing and dicing which can be awkward with JavaScript strings.

* Writing servers that capture packets, process them somehow, and then serve the processed data up in some way is
very straightforward in node.

* Node has a very good HTTP parser that is used to progressively decode HTTP sessions.
```

# Installation

This module is available through the [npm registry](https://www.npmjs.com/).

```bash
$ npm install pcap-ng-parser
```

# Usage

## Via .pcapng File
Here is a quick example of how to log out packets to the console from a valid .pcapng file named `myfile.pcapng`.

```javascript
const PCAPNGParser = require('pcap-ng-parser')
const pcapNgParser = new PCAPNGParser()
const myFileStream = require('fs').createReadStream('./myfile.pcapng')

myFileStream.pipe(pcapNgParser)
    .on('data', parsedPacket => {
        console.log(parsedPacket)
    })
    .on('interface', interfaceInfo => {
        console.log(interfaceInfo)
    })
```

In the example above, we create a new Readable stream from our file and pipe the instance `pcapNgParser` which will read our packet data on the `_transform` event. 

## Via TCPDump 

You can also pipe from TCPDump using `process.stdin` for a command line interaction.

```javascript
const PCAPNGParser = require('pcap-ng-parser')
const pcapNgParser = new PCAPNGParser()

process.stdin.pipe(pcapNgParser)
    .on('data', parsedPacket => {
        console.log(parsedPacket)
    })
    .on('interface', interfaceInfo => {
        console.log(interfaceInfo)
    })
```

```bash
$ sudo tcpdump -w - | node exampleAbove.js
```

Note that in order to utilize tcpdump you must be a superuser. Refer to [tcpdump documentation](http://www.tcpdump.org/manpages/tcpdump.1.html) for details. 

## Other Examples 

Additional examples can be found in the [examples directory](./examples).

# Class PCAPNGParser

PCAPNGParser is an extension of the [stream.Transform class](https://nodejs.org/api/stream.html#stream_class_stream_transform). The PCAPNGParser class has a modified `data` event and a custom `interface` event. For any additional details for how to interface with Transform streams, [refer to the Node.js stream documentation](https://nodejs.org/api/stream.html#stream_stream).

## Property 'interfaces'

- `interfaces` | `Array` | List of all interfaces that the instance of PCAPNGParser has interacted with.

## Event 'data'

- `parsedPacket` | `Object` | The parsed packet data. The `data` event is emitted whenever the PCAPNGParser stream is ready to relinquish ownership of packet data to a consumer. 

Example of a `parsedPacket` object:
```javascript
{
    interfaceId: 0,
    timestampHigh: 355515,
    timestampLow: 1834438968,
    data: <Buffer >
}
```

### Description of parsedPacket Properties

* `interfaceId` | `integer` | The order in which PCAPNGParser has interacted with the interface. Interface can be accessed by accessing the `interfaces` property of the instance of the PCAPNGParser class.
* `timestampHigh` | `integer` | The upper 32 bits of the 64-bit timestamp integer. Refer to the [PCAPNG documentation](http://xml2rfc.tools.ietf.org/cgi-bin/xml2rfc.cgi?url=https://raw.githubusercontent.com/pcapng/pcapng/master/draft-tuexen-opsawg-pcapng.xml&modeAsFormat=html/ascii&type=ascii#rfc.section.4.3) on this matter for more details.
* `timestampLow` | `integer` | The lower 32 bits of the 64-bit timestamp integer. Refer to the [PCAPNG documentation](http://xml2rfc.tools.ietf.org/cgi-bin/xml2rfc.cgi?url=https://raw.githubusercontent.com/pcapng/pcapng/master/draft-tuexen-opsawg-pcapng.xml&modeAsFormat=html/ascii&type=ascii#rfc.section.4.3) on this matter for more details.
* `data` | `buffer` | A buffer with the data of the current packet.

## Event 'interface'

- `interfaceInfo` | `object` | Interface Data. The `interface` event is emitted whenever the PCAPNGParser stream has encountered a new interface type not encountered yet.

Example of an `interfaceInfo` object:
```javascript
{
    linkType: 1,
    snapLen: 262144,
    name: 'en0'
}
```

### Description of interfaceInfo Properties

* `linkType` | `integer` | The linktype of the current interface. Refer to the [TCPDump Link-Layer header documentation](http://www.tcpdump.org/linktypes.html) for more details.
* `snapLen` | `integer` | An estimate for the length of the packets coming from the interface.
* `name` | `string` | The name of the interface.

# Contribution

Refer to the the [Contribution Guide](./docs/CONTRIBUTING.md) for details on how to contribute.

# License

This module is covered under the BSD-3 Open Software License. Review the [License Documention](./docs/LICENSE.md) for more information.




