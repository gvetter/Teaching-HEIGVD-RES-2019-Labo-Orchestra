const dgram = require('dgram');

const uuid = require('uuid/v4');

const protocol = require('./orchestra-protocol');

const sound = {
  piano: 'ti-ta-ti',
  trumpet: 'pouet',
  flute: 'trulu',
  violin: 'gzi-gzi',
  drum: 'boum-boum',
};

const socket = dgram.createSocket('udp4');

class Musician {

  constructor(instrument) {
    this.uuid = uuid();
    this.instrument = instrument;
    this.music = sound[instrument];
  }

  play() {
    const music = {
      uuid: this.uuid,
      instrument: this.instrument,
      sound: this.music,
    };

    const payload = Buffer.from(JSON.stringify(music));

    socket.send(payload, 0, payload.length, protocol.PROTOCOL_PORT,
      protocol.PROTOCOL_MULTICAST_ADDRESS, () => {
        console.log(`Sending payload: ${payload}\nvia port ${socket.address().port}.`);
      });
  }
}

if (process.argv.length !== 3) {
  throw new Error('Usage: node musician.js <instrument>');
} else if (!(process.argv[2] in sound)) {
  throw new Error('Instrument must be either piano, trumpet, flute, violin or drum');
}
const instrument = process.argv[2];

const musician = new Musician(instrument);

setInterval(musician.play.bind(musician), 1000);
