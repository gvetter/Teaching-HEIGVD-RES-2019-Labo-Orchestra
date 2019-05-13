const dgram = require('dgram');

const net = require('net');

const moment = require('moment');

const protocol = require('./orchestra-protocol');

const socket = dgram.createSocket('udp4');

socket.bind(protocol.PROTOCOL_PORT, () => {
  console.log('Joining multicast group');
  socket.addMembership(protocol.PROTOCOL_MULTICAST_ADDRESS);
  console.log('Waiting for musicians to play.');
});

const activeMusicians = new Map();

socket.on('message', (msg, source) => {
  console.log(`Payload received: ${msg}\nFrom port: ${source.port}`);

  const musician = JSON.parse(msg);

  if (!(activeMusicians.has(musician.uuid))) {
    activeMusicians.set(musician.uuid, {
      instrument: musician.instrument,
      activeSince: moment().toISOString(),
      activeLast: moment().unix(),
      sourcePort: source.port,
    });
  } else {
    activeMusicians.get(musician.uuid).activeLast = moment().unix();
  }
});

const server = net.createServer();

server.listen(protocol.PROTOCOL_PORT);

function summary() {
  const musiciansDisplay = [];

  activeMusicians.forEach((element, key) => {
    if (moment().unix() - element.activeLast > 5) {
      activeMusicians.delete(key);
    } else {
      musiciansDisplay.push({
        uuid: key,
        instrument: element.instrument,
        activeSince: element.activeSince,
      });
    }
  });

  return musiciansDisplay;
}

server.on('connection', (tcpSocket) => {
  const payload = JSON.stringify(summary(), null, 4);

  tcpSocket.write(payload);
  tcpSocket.end('\r\n');
});
