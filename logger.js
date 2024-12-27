const { createLogger, format, transports } = require('winston');
const path = require('path');

const logger = createLogger({
    level:'info',
    format:format.combine(
        format.timestamp({ format:'YYYY-MMM-DD HH:mm:ss' }),
        format.printf(({ timestamp, level, message, ...meta })=>{
            let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
            if (Object.keys(meta).length) {
                log += ` | Meta: ${JSON.stringify(meta)}`;
            }
            return log;
        }),
    ),
    transports:[
        new transports.Console(),
        new transports.File({
            filename:path.join(__dirname,'logs','error.log'),
            level:'error'
        }),
        new transports.File({
            filename:path.join(__dirname,'logs','combined.log')
        }),
    ],
});

module.exports = logger;