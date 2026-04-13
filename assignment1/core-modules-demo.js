const os = require("os");
const path = require("path");
const fs = require("fs");

const sampleFilesDir = path.join(__dirname, "sample-files");
if (!fs.existsSync(sampleFilesDir)) {
  fs.mkdirSync(sampleFilesDir, { recursive: true });
}
const demoPath = path.join(sampleFilesDir, "demo.txt");

async function runCoreModulesDemo() {
  // OS module
  const platform = os.platform();
  console.log("Platform:", platform);
  const cpuModel = os.cpus()[0].model;
  console.log("CPU:", cpuModel);
  const totalMem = os.totalmem();
  console.log("Total Memory:", totalMem);
  // Path module
  const finalPath = path.join(
    "/path",
    "to",
    "sample-files",
    "folder",
    "file.txt",
  );
  console.log("Joined path:", finalPath);

  // fs.promises API
  //async function handleDemoFile() {
  try {
    const fileContents = "Hello from fs.promises!";
    await fs.promises.writeFile(demoPath, fileContents, "utf-8");
    const data = await fs.promises.readFile(demoPath, "utf-8");
    console.log("fs.promises read:", data);
  } catch (error) {
    console.error("Async/Await error", error);
  }

  //handleDemoFile();

  // Streams for large files- log first 40 chars of each chunk
  const bigFilePath = path.join(sampleFilesDir, "largefile.txt");
  const bigFileTxt = "This is a line in a large file...\n";
  let bigFileContents = "";
  for (let i = 0; i < 100; i++) {
    bigFileContents += `${bigFileTxt}`;
  }
  fs.writeFileSync(bigFilePath, bigFileContents);

  await new Promise((resolve, reject) => {
    const readStream = fs.createReadStream(bigFilePath, {
      encoding: "utf8",
      highWaterMark: 1024,
    });
    readStream.on("data", (chunk) => {
      console.log("Read chunk:", chunk.slice(0, 40) + "...");
    });

    readStream.on("end", () => {
      console.log("Finished reading large file with streams.");
      resolve();
    });
    readStream.on("error", (err) => {
      reject(err);
    });
  });
}
runCoreModulesDemo();
