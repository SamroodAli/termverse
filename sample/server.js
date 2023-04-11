const http = require("http");

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Hello, World!\n");
});

const port = 3000; // Change this to the desired port number
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
