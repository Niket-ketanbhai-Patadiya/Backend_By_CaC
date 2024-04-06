const asyncHandler=(requestHandler)=>{
    (req,res,next)=>{
        Promise.resolve(requestHandler(req,res,next)).catch((err)=>next(err))
    }
}



export { asyncHandler }







// const asyncHandler=(func)=>{}
// we are using higher order function here below is the syntax for the same 
// const asyncHandler=(func)=>()=>{}
// const asyncHandler=(func)=>async ()=>{}


// const asyncHandler=(fn) => async (req,res,next) => {
//     try {
//         await fn(req,res,next)
//     } catch (error) {
//         res.status(err.code || 500).json({
//             success:false,
//             message:error.message
//         })
//     }
// }
