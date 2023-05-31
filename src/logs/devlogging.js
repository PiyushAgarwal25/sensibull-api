const { createLogger, transports, format } = require("winston");
const path = require('path');

const logLevel = process.env.NODE_ENV === 'production' ? 'error' : 'info';

const consoleFormat = format.combine(format.timestamp(), format.simple());
const fileFormat = format.printf(({ level, message, timestamp }) => {
    return `[${timestamp}] : ${level} -- ${JSON.stringify(message)}`;
  });

const transportsArray = [];

if (process.env.NODE_ENV !== 'production') {
  transportsArray.push(
    new transports.Console({
      level: logLevel,
    //   format: consoleFormat
    })
  );
}

transportsArray.push(
  new transports.File({
    filename:path.join(__dirname,"mylog.log"),
    level: logLevel,
    format: format.combine(format.timestamp(),fileFormat)
  })
);

const logger = createLogger({
  transports: transportsArray
});

module.exports = logger;




































// const logger = createLogger({
//   transports: [
//     new transports.Console({
//       level: false? "error" : "info",
//       format: format.combine(format.timestamp(), format.json()),
//       silent: false
//     }),
//     new transports.File({
//       filename: "error.log",
//       level: "error",
//       format: format.combine(format.timestamp(), format.json())
//     })
//   ]
// });

// logger.log("info", "This is a normal log message");
// logger.log("error", "This is an error log message");



// const customLogger = createLogger({
//     transports:[
//         new transports.File({
//             filename:'customer.log',
//             level:"info",
//             format:format.combine(format.timestamp(),format.json())
//         }),
//         new transports.File({
//             filename:'customer-error.log',
//             level:"error",
//             format:format.combine(format.timestamp(),format.json())
//         }),
//     ]
// });
// customLogger.log("info","Error finding customers");
// customLogger.log("error",new Error("this is the error"));
// module.exports = customLogger;
