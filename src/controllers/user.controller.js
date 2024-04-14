import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens=async(userId)=>{
    try{
        const user=await User.findById(userId)
        const accessToken=user.generateAccessToken()
        const refreshToken=user.generateRefreshToken()

        user.refreshToken=refreshToken
        await user.save({validateBeforeSave:false})

        return{accessToken,refreshToken}

    }catch(error){
        throw new ApiError(500,"something went wrong while generating refresh and access token")
    }
}

const registerUser=asyncHandler( async (req,res)=>{
    //    get user details from frontend
    //    validation- not empty
    //    check if user already exists
    //    check for images
    //    check for avatar image
    //    upload them to cloudinary, avatar
    //    create user object - create entry in db
    //    remove password and refresh token field from response
    //    check for user creation
    //    return res

    const { fullname, username, email ,password }=req.body
    console.log(email);
    console.log(req.User._id);

    if(
        [fullname,email,username,password].some((field)=>
        field?.trim()===""
    )
    ){
        throw new ApiError(400,"all fields are required")
    }
        
   const existedUser= await User.findOne({
        $or:[{username} , {email}]
    })

    if(existedUser){
        throw new ApiError(409,"user with email or username already exist")
    }

    // console.log(req.files); do this for seeing what is in this object

    const avatarLocalPath=req.files?.avatar[0]?.path
    // const coverImageLocalPath=req.files?.coverImage[0]?.path

    // classic way to check whether cover image is present ot not...above is the advance way which sometimes give error when coverimage is not present
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
        coverImageLocalPath=req.files?.coverImage[0].path
    }

    if(!avatarLocalPath){
        throw new ApiError(400,"avatar file is required")
    }
    const avatar=await uploadOnCloudinary(avatarLocalPath)
    const coverImage=await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400,"avatar file is required")
    }

    const user=await User.create({
        fullname,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        username:username.toLowerCase()
    })
    const createdUser=await User.findById(user._id).select(
        "-password --refreshToken"
    );
    if(!createdUser){
        throw new ApiError(500,"something went wrong while registering the user")
    }

    res.status(201).json(
        new ApiResponse(200,createdUser,"user registered successfully")
    )

})

const loginUser=asyncHandler(async(req,res)=>{
    // req body ->body
    // username or email
    // find the user
    // password check
    // access and refresh token   
    // send cookie 
    try {
        
        const {email,username,password}=req.body
        if(!(username || email)){
            throw new ApiError(400,"username or password is required")
        }

        // here is an alternative of the above code as based on logic discussed in the video
        // if(!username && !email){
        // throw new ApiError(400,"username or password is required")
        // }



        const user= await User.findOne({
            $or:[{username},{email}]
        })
    
        if(!user){
            throw new ApiError(404,"user not exists")
        }
    
        const isPasswordValid=await user.isPasswordCorrect(password)
        if(!isPasswordValid){
            throw new ApiError(401,"Invalid user credentials")
        }
    
        if (!user._id) {
            throw new ApiError(500, "User ID not found");
        }
    
        const {accessToken,refreshToken}=await generateAccessAndRefreshTokens(user._id)
    
        // const loggedInUser=await User.findById(user._id).select("-password -refreshToken")
        const loggedInUser = user ? await User.findById(user._id).select("-password -refreshToken") : null;
        console.log(loggedInUser);
    
        const options={
            httpOnly:true,
            secure:true
        }
    
        return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",refreshToken,options)
        .json(
            new ApiResponse(
                200,
                {
                    user:loggedInUser,accessToken,refreshToken
                },
                "User Logged In successfully"
            )
        )
    
    } catch (error) {
        next(error)
    }
})

const logoutUser=asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.User._id,
        {
            $set:{
                refreshToken:undefined
            },
            $unset:{
                refreshToken:1
            }
        },
        {
            new:true
        }
    )
    const options={
        httpOnly:true,
        secure:true
    }
    return res 
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200, {}, "User Logged Out"))
})

const refreshAccessToken=asyncHandler(async (req,res)=>{
    const incomingrefreshToken=req.cookies.refreshToken || req.body.refreshToken
    if(!incomingrefreshToken){
        throw new ApiError(400,"unauthorized request")
    }


try {
    // const hii=jwt.verify(refreshAccessToken,process.env.REFRESH_TOKEN_SECRET)
    const decodedToken=jwt.verify(incomingrefreshToken,process.env.REFRESH_TOKEN_SECRET)
    const user= await User.findById(decodedToken?._id)
    if(!user){
        throw new ApiError(400,"invalid refresh token")
    }
    
    if(incomingrefreshToken !== user?.refreshToken){
            throw new ApiError(400,"refresh token is expired or used")
        }
    
        const options={
            httpOnly:true,
            secure:true
        }
    
        const {accessToken,newRefreshToken}=await generateAccessAndRefreshTokens(user._id)
        return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newRefreshToken,options)
        .json(
            new ApiResponse(
                200,
                {accessToken,refreshToken:newRefreshToken},
                "Access token refreshed"
            )
        )
} catch (error) {
    throw new ApiError(401, error?.message || "invalid refresh token")
}

})

const changeCurrentPassword=asyncHandler(async (req,res)=>{
    const {oldPassword,currentPassword}=req.body

    const user=await User.findById(req.user?._id)  // if not works then req.User?._id
    const isPasswordCorrect=await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400,"Invalid Old Password")
    }

    user.password=newPassword
    await user.save({validateBeforeSave:false})

    return res
    .status(200)
    .json(
        new ApiResponse(200,{},"Password changed Successfully")
    )
})

const currentUser=asyncHandler(async(req,res)=>{
    return res
    .status(200)
    .json(
        200,req.user,"current user fetched successfully"
    )
})

const updateAccountDetails=asyncHandler(async(req,res)=>{
    const {fullname,email}=req.body

    if(!fullname || !email){
        throw new ApiError(400,"All fields are required")
    }

    const user=User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullname,
                email
            }
        },
        {new:true}
    ).select("-password")

    return res.status(200).ApiResponse(200,user,"Account Details Updated Successfully")
})


const updateUserAvatar=asyncHandler(async(req,res)=>{
    const avatarLocalpath=req.file?.path

    if(!avatarLocalpath){
        throw new ApiError(400,"Avatar file is missing")
    }

    const avatar=await uploadOnCloudinary(avatarLocalpath)

    if(!avatar.url){
        throw new ApiError(400,"Error while uploading on avatar")
    }

   const user= await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar:avatar.url
        }},
        {new:true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200,user,"avatar Updated successfully"))
})



const updateUserCoverImage=asyncHandler(async(req,res)=>{
    const coverImageLocalpath=req.file?.path

    if(!coverImageLocalpath){
        throw new ApiError(400,"cover Image file is missing")
    }

    const coverImage=await uploadOnCloudinary(coverImageLocalpath)

    if(!coverImage.url){
        throw new ApiError(400,"Error while uploading on avatar")
    }

    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage:coverImage.url
        }},
        {new:true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200,user,"Cover Image Updated successfully"))
})


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    currentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage
}