const BlockConfig = require('./BlockConfig')
const { Transform } = require('stream')

class PCAPNGParser extends Transform {
    constructor() {
        //The magic bit to allow objects
        super({
            readableObjectMode: true
        })
        this.sectionHeader = undefined
        this.carryData = undefined
        this.endianess = 'LE'
        this.interfaces = []
    }

    _transform(chunk, encoding, callback) {
        let buf = chunk
        //Stitch previous data packet fragment
        if (this.carryData) {
            buf = Buffer.concat([this.carryData, chunk])
            this.carryData = undefined
        }

        let pos = 0
        while (pos < (buf.length)) {
            
            if (!this.sectionHeader) {
                try {
                    pos = this.readHeaderBlockFromBuffer(buf)
                } catch (err) {
                    callback(err)
                    return
                }
            } else if (pos + 8 >= buf.length) {
                //If we don't have enough to read the next block length save the remaining data to be pre-pended to the next received data
                this.carryData = buf.slice(pos)
                pos = buf.length
            } else {
                //Read block type and length
                let block = this.readBlock(buf, BlockConfig.blockConfig, this.endianess, pos)

                if (pos + block.data.blockTotalLength > buf.length) {
                    // This block is bigger than the data we have so save it to be pre-pended to the next received data
                    this.carryData = buf.slice(pos)
                    pos = buf.length
                } else {
                    // We have the entire block, go ahead and process itj
                    let blockData = buf.slice(pos, pos + block.data.blockTotalLength)
                    let outputDataBlock = this.processRawBlock(blockData, block.data.blockType)
                    if (outputDataBlock) {
                        let sendBlock = Object.assign({}, outputDataBlock)
                        delete sendBlock.blockType
                        delete sendBlock.blockTotalLength
                        delete sendBlock.capturedPacketLength
                        delete sendBlock.originalPacketLength
                        this.push(sendBlock)
                    }
                    pos = pos + block.data.blockTotalLength

                    if(block.data.blockTotalLength <= 0) {
                        callback(new Error("Invalid block with size 0, unable to scan stream"))
                        return
                    }
                }
            }

        } //end while pos

        callback()
    }
    
    _flush() {
        // console.log("Got end")
        this.emit('close')
    }
    
    readBlock (buf, blockDescriptor, endian = 'LE', offset = 0) {
        let pos = offset
        let props = {}
        for (let prop in blockDescriptor) {
            let {
                size,
                signed
            } = blockDescriptor[prop]
            let readMethod = 'read' + (signed ? '' : 'U') + 'Int' + (size * 8) + endian
            props[prop] = buf[readMethod](pos)
            pos += size
        }
        return {
            newOffset: pos,
            data: props
        }
    }

    readHeaderBlockFromBuffer(buf) {
        //Read the header block to determine endianess and make sure its a PCAP-NG file
        let blockType = buf.readUInt32BE(0)
        this.checkBlockTypeFromBuffer(blockType)

        let byteOrderMagic = buf.readUInt32BE(8)
        this.endianess = this.processByteOrderMagic(byteOrderMagic)
        
        let res = this.readBlock(buf, BlockConfig.sectionHeaderBlock, this.endianess, 0)
        this.sectionHeader = res.data
        
        // let secLen = buf.readUInt32LE(this.sectionHeader.blockTotalLength - 4)
        return this.sectionHeader.blockTotalLength
    }

    processByteOrderMagic(byteOrderMagic) {
        if (byteOrderMagic === 0x1A2B3C4D) {
            return 'BE'
            // console.log("Detected BE endian")
        } else if (byteOrderMagic === 0x4D3C2B1A) {
            return 'LE'
            // console.log("Detected LE endian")
        } else {
            // console.log("Unable to determine endian from " + byteOrderMagic.toString(16))
        }
    }

    checkBlockTypeFromBuffer (blockType) {
        if (blockType === 0x0A0D0D0A) {
            // console.log("Recognized PCAP-NG file")
        } else {
            let err = "Invalid file, block type of " + blockType.toString(16) + " not recognized"
            throw new Error(err)
        }
    }

    readOptions (buf) {
        let pos = 0
        let foundEndOption = false
        let options = []
        while (pos < buf.length || foundEndOption) {
            let rb = this.readBlock(buf, BlockConfig.optionBlock, this.endianess, pos)
            pos = rb.newOffset + (rb.data.dataLength * 8)
            if (rb.data.code === 0) {
                foundEndOption = true
            } else {
                rb.data.data = buf.slice(pos - (rb.data.dataLength * 8), pos)
                options.push(rb.data)
            }
        }
        return options
    }
    /**
     * @see http://xml2rfc.tools.ietf.org/cgi-bin/xml2rfc.cgi?url=https://raw.githubusercontent.com/pcapng/pcapng/master/draft-tuexen-opsawg-pcapng.xml&modeAsFormat=html/ascii&type=ascii#rfc.section.3.1
     * @param {Buffer} blockData 
     * @param {int} blockType 
     */
    
    processRawBlock (blockData, blockType) {
        if (blockType < 0) {
            //MSB of 1 indicates this is 'local use' data 
        } else if (blockType === 1) {
            //Interface definition

            let iData = {}
            let idRes = this.readBlock(blockData, BlockConfig.interfaceDescriptionBlockFormat, this.endianess, 0)
            iData.linkType = idRes.data.linkType
            iData.snapLen = idRes.data.snapLen
            if (idRes.newOffset < blockData.length) {
                let opts = this.readOptions(blockData.slice(idRes.newOffset))
                opts.forEach((opt) => {
                    if(opt.code == 2) {
                        iData.name = opt.data.toString('utf8').replace(/\0/g,'').trim()
                    } else {
                        iData['code_'+opt.code] = opt.data.toString()
                    }
                })
            }
            this.interfaces.push(iData)

            //Notify listeners we got a new interface
            this.emit('interface', iData)
        } else if (blockType === 6) {
            //Enhanced block... data
            let id = this.readBlock(blockData, BlockConfig.enhancedPacketBlockFormat, this.endianess, 0)
            id.data.data = blockData.slice(id.newOffset, id.newOffset+id.data.capturedPacketLength)
            return id.data
        } else {
            this.emit("Block type: " + blockType)
        }
    }

}

module.exports = PCAPNGParser
