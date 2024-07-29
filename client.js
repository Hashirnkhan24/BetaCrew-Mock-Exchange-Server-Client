const net = require('net');
const fs = require('fs/promises');

const host = 'localhost';
const port = 3000;
const packetSize = 17;
let receivedPackets = [];
let expectedSequence = 1;
let resendQueue = [];

const client = new net.Socket();

// Sending a request to the Betacrew server
const sendRequest = (callType, resendSeq = 0) => {
  const buffer = Buffer.alloc(2);
  buffer.writeUInt8(callType, 0);
  buffer.writeUInt8(resendSeq, 1);
  client.write(buffer);
};

// Handling data received from the server via the reqest
client.on('data', (data) => {
  try {
    // Processing data in case of full packets available
    while (data.length >= packetSize) {
      const packetBuffer = Buffer.alloc(packetSize);
      data.copy(packetBuffer, 0, 0, packetSize);
      data = data.subarray(packetSize); 

      // Parsing packet data
      const symbol = packetBuffer.toString('utf8', 0, 4);
      const buySell = packetBuffer.toString('utf8', 4, 5);
      const quantity = packetBuffer.readInt32BE(5);
      const price = packetBuffer.readInt32BE(9);
      const sequence = packetBuffer.readInt32BE(13);

      const packet = { symbol, buySell, quantity, price, sequence };

      // Handling in-order packets
      if (sequence === expectedSequence) {
        receivedPackets.push(packet);
        expectedSequence++;
      } else if (sequence > expectedSequence) {
        // Handling out-of-order packets
        if (!resendQueue.includes(sequence)) {
          resendQueue.push(sequence);
        }
        receivedPackets.push(packet);
      } else {
        // Handling duplicate packets
        console.log('Duplicate packet received:', packet);
      }
    }
  } catch (err) {
    console.error('Error processing data:', err);
  }
});

// Handling end of data transmission
client.on('end', async () => {
  try {
    // Requesting missing packets
    while (resendQueue.length > 0) {
      const missingSeq = resendQueue.shift();
      const packet = receivedPackets.find(p => p.sequence === missingSeq);
      if (packet) {
        receivedPackets.splice(receivedPackets.indexOf(packet), 1);
      } else {
        console.error('Missing packet:', missingSeq);
        sendRequest(2, missingSeq);
      }
    }

    // Sorting packets by sequence number
    receivedPackets.sort((a, b) => a.sequence - b.sequence);

    // Saving the received data to output.json file
    await fs.writeFile('output.json', JSON.stringify(receivedPackets, null, 2));
    console.log('Data saved to output.json');
  } catch (err) {
    console.error('Error handling end of data transmission:', err);
  }
});

// Connecting to the BetaCrew server and initiate the data request
client.connect(port, host, () => {
  console.log('Connected to Betacrew Server');
  sendRequest(1); // Request to stream all packets
});

// Handling connection errors
client.on('error', (err) => {
  console.error('Connection error:', err);
});

// Closing the connection
client.on('close', (hadError) => {
  if (hadError) {
    console.error('Connection closed due to an error');
  } else {
    console.log('Connection closed');
  }
});

// In case of uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Unhandled exception:', err);
  client.destroy(); // Terminating the client on error
});

// Handling unhandled promise rejections in any
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
  client.destroy(); // Terminating the client on error
});
