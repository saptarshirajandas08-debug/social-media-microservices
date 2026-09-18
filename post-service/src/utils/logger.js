// winston aims to decouple parts of the logging process to make it more flexible and extensible.
const winston = require('winston');

const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production'? 'info' : 'debug',
    format: winston.format.combine(
        //this is for how we format the messages
        winston.format.timestamp(), //reflect the time.
        winston.format.errors({stack: true}), //this is for stack trace if there is any error.
        winston.format.splat(),  // the log method provides the string interpolation using util.format. It enables support for message templating.
        winston.format.json(), // and here we are formatting all the logs into JSON
    ),
    defaultMeta: {service: 'post-service'},
    transports:[ // this is specify the transport or output destination for the logs
        new winston.transports.Console({ //we will get it in the terminal when we get something log
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple(), 
                //colorize and simple for readebility
            ),
        }),
        new winston.transports.File({filename: 'error.log', level: 'error'}), //file for error
        new winston.transports.File({filename: 'combined.log'}) //file for log
    ]
})
module.exports = {logger};