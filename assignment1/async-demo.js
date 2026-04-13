const fs = require("fs");
const path = require("path");
const util = require("util");

// Write a sample file for demonstration
const dirPath = path.join(__dirname, "sample-files");
const filePath = path.join(dirPath, "sample.txt");
const contentsSample = "Hello, async world!";

(async () => {
  try {
    await fs.promises.mkdir(dirPath, { recursive: true });
    //using {recursive:true} I used the AI reviewer tool for this part since using mkdir alone with dirPath was giving me errors. I learned that recursive will tell the application to only make the directory/folder if it is missing as well as any parent folders, but if it exists to continue in the code
    await fs.promises.writeFile(filePath, contentsSample, "utf-8");

    // 1. Callback style
    fs.readFile(filePath, "utf-8", (error, response) => {
      if (error) {
        console.error(error);
        return;
      }
      console.log("Callback read:", response);
    });

    // Callback hell example (test and leave it in comments):
    //Callback hell occurs when we nest multiple callbacks within each other and so the code becomes more challenging to read and follow

    /*fs.readFile(filePath, "utf8", (error, response) => {
      if (error) {
        console.log(error);
        return;
      } else {
        console.log("1:", response);
        fs.readFile(filePath, "utf8", (error, response) => {
          if (error) {
            console.log(error);
          } else {
            console.log("2:", response);
            fs.readFile(filePath, "utf8", (error, response) => {
              if (error) {
                console.log(error);
              } else {
                console.log("3:", response);
              }
            });
          }
        });
      }
    });
*/
    // 2. Promise style
    const promisifiedPhrase = util.promisify(fs.readFile);
    try {
      const promiseResponse = await promisifiedPhrase(filePath, "utf-8");
      console.log("Promise read:", promiseResponse);
    } catch (error) {
      console.error("Promise Error:", error);
    }

    // 3. Async/Await style
    try {
      const data = await fs.promises.readFile(filePath, "utf-8");
      console.log("Async/Await read:", data);
    } catch (error) {
      console.error("Async/Await error", error);
    }
  } catch (error) {
    console.error("Setup Error:", error);
  }
})();
