const http = require("http");
const htmlString = `
<!DOCTYPE html>
<html>
<body>
<h1>Clock</h1>
<button id="getTimeBtn">Get the Time</button>
<p id="time"></p>
<script>
document.getElementById('getTimeBtn').addEventListener('click', async () => {
    const res = await fetch('/time');
    const timeObj = await res.json();
    console.log(timeObj);
    const timeP = document.getElementById('time');
    timeP.textContent = timeObj.time;
});
</script>
</body>
</html>
`;

const server = http.createServer({ keepAliveTimeout: 60000 }, (req, res) => {
  if (req.url === "/time") {
    const currentTime = new Date().toLocaleTimeString();
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        time: currentTime,
      }),
    );
  } else if (req.url === "/timePage") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(htmlString);
    //THE 404 Route (step3)
  } else {
    res.writeHead(404, { "Content-type": "application/json" });
    res.end(JSON.stringify({ message: "That route is not found." }));
  }
});
//5. Open the door
server.listen(8000, () => {
  console.log("server is listening");
});
