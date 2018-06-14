const assert = require('chai').assert;
const PCAPNGParser = require('../src/PCAPNGParser')
const pcapNgParser = new PCAPNGParser()
const fs = require('fs')

describe('PCAPNGParser', function() {
  describe(`.on('data')`, function() {
    it('should return an object given a Buffer Stream', function() {
      let bufferStream0 = fs.createReadStream('./test/buffer/buffer0')
      let bufferStream1 = fs.createReadStream('./test/buffer/buffer1')
      bufferStream0
        .pipe(pcapNgParser, { end: false })
        .on('data', (parsedPacket) => {
          assert.isObject(parsedPacket, 'parsedPacket is an object')
        })
      bufferStream1
        .pipe(pcapNgParser, { end: false })
        .on('data', (parsedPacket) => {
          assert.isObject(parsedPacket, 'parsedPacket is an object')
        })
    });
    it('should return an object with properties interfaceId, timestampHigh, timestampLow, data & ethernet', function() {
      let bufferStream0 = fs.createReadStream('./test/buffer/buffer0')
      let bufferStream1 = fs.createReadStream('./test/buffer/buffer1')
      bufferStream0
        .pipe(pcapNgParser, { end: false })
        .on('data', (parsedPacket) => {
          assert.property(parsedPacket, 'interfaceId', 'parsedPacket has property interfaceId')
          assert.property(parsedPacket, 'timestampHigh', 'parsedPacket has property interfaceId')
          assert.property(parsedPacket, 'timestampLow', 'parsedPacket has property interfaceId')
          assert.property(parsedPacket, 'data', 'parsedPacket has property interfaceId')
        })
      bufferStream1
        .pipe(pcapNgParser, { end: false })
        .on('data', (parsedPacket) => {
          assert.property(parsedPacket, 'interfaceId', 'parsedPacket has property interfaceId')
          assert.property(parsedPacket, 'timestampHigh', 'parsedPacket has property interfaceId')
          assert.property(parsedPacket, 'timestampLow', 'parsedPacket has property interfaceId')
          assert.property(parsedPacket, 'data', 'parsedPacket has property interfaceId')
        })
    })
  });
  describe(`.on('interface')`, function() {
    it('should return an object given a Buffer Stream', function() {
      let bufferStream0 = fs.createReadStream('./test/buffer/buffer0')
      let bufferStream1 = fs.createReadStream('./test/buffer/buffer1')
      bufferStream0
        .pipe(pcapNgParser, { end: false })
        .on('interface', (i) => {
          assert.isObject(i, 'i is an object')
        })
      bufferStream1
        .pipe(pcapNgParser, { end: false })
        .on('interface', (i) => {
          assert.isObject(i, 'i is an object')
        })
    })
    it('should return an object with properties linkType, snapLen & name', function() {
      let bufferStream0 = fs.createReadStream('./test/buffer/buffer0')
      let bufferStream1 = fs.createReadStream('./test/buffer/buffer1')
      bufferStream0
        .pipe(pcapNgParser, { end: false })
        .on('interface', (i) => {
          assert.property(i, 'linkType', 'i has property linkType')
          assert.property(i, 'snapLen', 'i has property snapLen')
          assert.property(i, 'name', 'i has property name')
        })
      bufferStream1
        .pipe(pcapNgParser, { end: false })
        .on('interface', (i) => {
          assert.property(i, 'linkType', 'i has property linkType')
          assert.property(i, 'snapLen', 'i has property snapLen')
          assert.property(i, 'name', 'i has property name')
        })
    })
  });
});


