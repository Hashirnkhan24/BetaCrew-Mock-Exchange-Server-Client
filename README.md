# BetaCrew Mock Exchange Server Client

This is a Node.js client implementation to interact with the BetaCrew mock exchange server. The client connects to the server, requests data, handles responses, and saves the received data to an output file.

## Features

- Establishes a TCP connection with the BetaCrew server.
- Sends requests to stream all packets or resend specific packets.
- Parses received packets and handles in-order, out-of-order, and duplicate packets.
- Requests missing packets after initial data transmission.
- Saves the received data to `output.json`.
- Handles connection errors, uncaught exceptions, and unhandled promise rejections.

## Usage

1. **Install Dependencies**

   Ensure you have Node.js installed. Then, install the required dependencies:

   ```bash
   npm install

   ```

2. **Run the Server**

   Start the BetaCrew Server:

   ```bash
   node main.js

   ```

3. **Run the Node Client**

   Start the client to connect to the BetaCrew server:

   ```bash
   node client.js

   ```

4. **Check Output**

   After running the client, check the `output.json` file for the received data.
