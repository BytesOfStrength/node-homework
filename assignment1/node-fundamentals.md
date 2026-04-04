# Node.js Fundamentals

## What is Node.js?

As per Nodejs.org, "Node.js is an open-source, cross-platform JavaScript runtime environment" that lets developers execute JavaScript outside of a browser

Key attributes include:

- **V8 Engine:** JavaScript Engine that uses Just-In-Time (JIT) compiler to compile and translate JS to machine code. This engine also includes a garbage collector which cleans up unneeded data from the memory. This clean-up tool improves the engine's efficiency because it frees up space that might slow down the engine.
- **Asynchronous and Non-blocking:** Libuv library utilizes event loops and a single thread to prevent blocking of input/output (I/O) operations. Even though Node.js's JavaScript uses a single main thread, the use of asynchronous callbacks and the event loop with Libuv's small pool of worker threads let Node.js handle multiple I/O operations without blocking each other. This is great for data-intensive operations, but is not as effective for CPU-intensive operations in which JavaScript can block I/O operations.
- **Package Ecosystem:** Node Package Manager is the default package manager and registry for a vast amount of pre-built reusable code that can be installed, automated, updated easily by developers.
- **Server-Side Execution:** JavaScript can be used not only for front-end development, but also back-end development. Node.js has built-in modules that can manage and create a raw server socket. For example, Node.js may use http via its built-in module, http. Node.js can access and modify the file system and network.

## How does Node.js differ from running JavaScript in the browser?

Node.js differs from running JavaScript in the browser in several ways.

- **Environment and Security:**
  - Due to security restrictions, running JavaScript in the browser doesn’t have direct access to local file systems or to the operating system. It runs in a "Sandbox" mode so a website cannot read or write files in a local system for security reasons.
  - Node.js: Node can access the local file system with its built-in "fs" module and also access the local operating system of a computer. Node.js can create its own server as well as directly make changes to the user’s file system. It can also manage server-side sockets. It runs as a standalone application on the local system and uses its built-in modules to make changes to the system and its network.

- **Global Objects and APIs:**

      *  Running JavaScript in the browser provides the window object (global), document object, and high level Web APIs which includes the DOM. This affects the UI and can control what the screen shows to a user. It also provides storage APIs like LocalStorage.

      *  Instead of window which doesn't exist in Node, Node.js provides the global object. Node also has no access to the DOM or document object. It uses the global object and built-in modules (such as fs, os, http) to handle server-side operations such as accessing the local filesystem and managing network requests which enable building and hosting REST APIs.

      *  Just note: globalThis allows a global object (window or global object) to be accessed in both modern JavaScript browser environment and the Node.js environment

- **Module Systems:**
  - The Browser Environment: Supports ES modules using import and export or via bundlers

  - Node.js: Prior to version 12 of Node, Node could only use CommonJS modules (CJS) using require and module.exports. Since version 12 Node, Node can use both CommonJS and ES modules (ESM). In order for Node to use ESM, it either needs to have a .mjs extension on the file or change a configuration in the package.json

- **Event Loops:** Both environments use event loops.
  - Browser Environment: uses event driven loops to manipulate rendering and UI updates due to user input to optimize the UI and user experience
  - Node.js: uses event driven loops to optimize I/O operations to handle file system tasks and networking requests.

- **Primary Focus:**
  - Running JavaScript on the browser is focused on UI and interaction from the user.
  - Node.js is focused on server-side tasks: data processing, real-time data flow,and building network applications.

## What is the V8 engine, and how does Node use it?

According to the Node.js Foundation, the V8 engine (written in C++) is Google’s open-source JavaScript engine that parses, compiles, and executes JavaScript code. Even though it was originally designed for the Google Chrome browser, it is able to parse, compile, and execute JavaScript code independently of the browser where it is hosted. (https://nodejs.org/en/learn/getting-started/the-v8-javascript-engine).

**Execution Power:**

The V8 Engine uses an interpreter (Ignition) and JIT compiler (TurboFan) to process JavaScript code directly into native machine code. Since V8 primarily focuses on the execution of JavaScript, it does not provide browser-specific global objects(document, window, etc). V8 has a C++ API so it can be embedded in any C++ application, e.g. Node.js. The V8 engine includes a Garbage Collector that manages memory automatically by removing unneeded data, thus improving the runtime efficiency.

**Node integration with V8:**

Node embeds V8 engine as its JavaScript runtime. Node.js adds V8’s capabilities to its own built-in modules (fs, os, http) and libuv library. Node’s built-in modules provide access to the host machine while libuv library assists Node.js with asynchronous I/O operations within local networks and filesystems. The combination of the V8 engine, built-in modules and libuv enable Node.js to provide server side capabilities by replacing browser-specific objects (such as DOM or a Web-API platform) with direct access to the local filesystem and network.
(information compiled from Nodejs.org (Node.js Foundation, n.d. The V8 JavaScript Engine), and https://dev.to/aditya_fe/how-javascript-executed-in-the-v8-engine-53bb)

## What are some key use cases for Node.js?

- **File System Management:**
  - Reading and writing JavaScript code in a local filesystem
  - Creating or removing directories
  - Monitoring file changes

- **Command Line Tools:**
  - Command Line Interface (CLI) tools such as npm to automate tasks

- **Server-Side Applications:**
  - Building web servers
  - Building REST APIs

- **Building Full-Stack Applications with Only One Language**

* **Streaming and Real-Time Apps:**
  - Chat and streaming data apps where data needs to pass back and forth quickly

- **Access the Local Operating System:**
  - Change permissions for a file
  - Retrieve information about the operating system

## Explain the difference between CommonJS and ES Modules. Give a code example of each.

- **CommonJS** uses synchronous run-time loaded modules. Since Node uses server-side code, the local files can load synchronously and still not block the user’s UI (user interface). There is some flexibility with CJS. For example, since 'require' can be called at runtime, it can be within an 'if' statement and can load modules only when needed.

- **ES Modules** supports asynchronous/dynamic loading. The browser may need to run multiple blocks of code, but by doing it asynchronously, it will allow parts of code to run in the background and not delay parts of other code that may not take as much time to run without waiting for the larger code to finish. This is ideal for browsers to run optimally.

- CommonJS and ES Modules are module systems that are used for importing or exporting code.
  - **Browser Support:**
    CommonJS and ES module support are available to Node.js ,but only ES modules are available to use with running JavaScript in the Browser. Legacy Node.js could only use CommonJS in the past, but after version 12, Node.js can use ES modules to write code if it has an extension '.mjs' or if you list in package.json file 'type':'module'

  - **Syntax differences:**
    - CommonJS uses the word 'require' to import objects, functions but ES modules use the word 'import':

    - ES Modules must write out import at the beginning of the code, but CJS can write a require statement within an if block to import code

    - CommonJS uses the word 'module.exports' to export code, but ES modules use the terms 'export default' or 'export' followed by the name of the function.

**CommonJS (default in Node.js):**
example code:

```js
const fs = require("fs");
const friend = () => console.log("Hello Friend, we require your positivity");
module.exports = { friend };
```

**ES Modules (supported in modern Node.js):**
example code:

```js
import fs from "fs";
export const friend = () => {
  console.log("Hello Friend, we import your positivity");
};
```

References:

1. Code the Dream. (n.d). _Setup and Installation_ [Node v4, Lesson 26.2]. Retrieved March 31, 2026, from https://classes.codethedream.org/course/node-v4/node-26.2?week=1&lesson=Setup%20and%20Installation

2. Node.js Foundation. (n.d.). Introduction to Node.js. Retrieved March 24, 2026, from
   https://nodejs.org/en/learn/getting-started/introduction-to-nodejs

3. Node.js Foundation. (n.d.). Differences between Node.js and the Browser. Retrieved March 31, 2026, from

https://nodejs.org/en/learn/getting-started/differences-between-nodejs-and-the-browser

4. Node.js Foundation. (n.d.). The V8 JavaScript Engine. Retrieved March 31, 2026, from

https://nodejs.org/en/learn/getting-started/the-v8-javascript-engine

5. Aditya, M.P.V. (2024, March 28). *How JavaScript executed in the V8 engine.*DEV.to. Retrieved March 31,2026,from
   https://dev.to/aditya_fe/how-javascript-executed-in-the-v8-engine-53bb
