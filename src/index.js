// require('dotenv').config({path:'./env'})

// for using import statement with dotenv
import dotenv from "dotenv"
dotenv.config({
    path:'./.env'
})
// now in json file in "dev":"-r dotenv/config --experimental-json-modules" 
// give it as import dotenv as experimental feature  
// })



import connectDB from "./db/index.js";
import { app } from "./app.js";


connectDB()

.then(()=>{
  app.on("error",(error)=>{
    console.log("Error in Listening ", error);
  })

  app.listen(process.env.PORT || 8000, ()=>{
    console.log(`Server is listening at PORT: ${process.env.PORT}`);
  })
})
.catch((err)=>{
console.log("Mongo DB Connection failed",err);
process.exit(1);
})







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