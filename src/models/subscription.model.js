import mongoose, {Schema} from "mongoose";
// import { User } from '.';

const subscriptionSchema=new Schema({
    subscriber:{
        type:Schema.Types.ObjectId, // one who is subscribing
        ref:"User"
    },
    channel:{
        type:Schema.Types.ObjectId, // one to whom 'subscriber' is subscribing channel
        ref:"User"
    }


}, {timestamps:true})

export const Subscription=mongoose.model("Subscription",subscriptionSchema)