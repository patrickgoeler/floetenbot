import winston, { format } from "winston"

const { combine, timestamp: WinstomTimestamp, label: WinstonLabel, printf } = format

const myFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${label}] ${level}: ${message}`
})

const logger = winston.createLogger({
  transports: [new winston.transports.Console(), new winston.transports.File({ filename: "log/log" })],
  format: combine(WinstonLabel({ label: "right meow!" }), WinstomTimestamp(), myFormat),
})

export default logger
