const mongoose = require('mongoose')
const dotenv = require('dotenv')
dotenv.config({path: './config.env'})

process.on('uncaughtException', err => {
    console.log(err.name, err.message);
    console.log('UNCAUGHT EXCEPTION! Shutting down!')
    process.exit(1)
})

const app = require("./app");

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD)

const PORT = process.env.PORT || 8000;

mongoose.connect(DB)
.then(() => console.log('MongoDB is ready!'))

const server = app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`)
})

process.on('unhandledRejection', err => {
    console.log(err.name, err.message);
    console.log('UNHANDLED REJECTION! Shutting down!')
    server.close(() => {
        process.exit(1);
    })
})

