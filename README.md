# Peario Server

## Development

Create an SSL certificate
```
openssl req -x509 -sha256 -nodes -newkey rsa:2048 -days 365 -keyout localhost.key -out localhost.crt
```

Create a `.env` file at the root of the project and place those variables
```
PORT=8181
PEM_CERT=cert/localhost.crt // location of your signed cetficate 
PEM_KEY=cert/localhost.key // location of your cetficate private key
INTERVAL_CLIENT_CHECK=3000
INTERVAL_ROOM_UPDATE=600000
```

Open `https://localhost:8181` in your browser and click `Accept the risk and Continue` (Firefox) or `Proceed to localhost (unsafe)` (Chrome)

Install dependencies
```
npm i
```

Run the server
```
npm start
```
