// require('dotenv').config({path:'./env'})

// for using import statement with dotenv
import dotenv from "dotenv"
dotenv.config({
    path:'./env'
})
// now in json file in "dev":"-r dotenv/config --experimental-json-modules" 
// give it as import dotenv as experimental feature  
// })



import connectDB from "./db/index.js";



connectDB();








/* first approach to connect with the database
import express from "express";
const app=express();
// function connectDB(){}

( async() => {
    try {
      await  mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
      app.on("error",(error)=>{
        console.log("Error: ",error);
        throw error;
      })
      app.listen(process.env.PORT,()=>{
        console.log(`app is listening on PORT ${process.env.PORT}`);
      })
    } catch (error) {
        console.error("ERROR: ",error)
        throw err
    }
})()*/