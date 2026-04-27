import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import z from 'zod'
import { prisma } from './db';
import bcrypt from 'bcryptjs'
import { generatedToken , getUserId} from './middleware/auth';
import logger from './util/logger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
// const JWT_SECRET = process.env.JWT_SECRET ?? ''


// Routes will go here

const signupSchema = z.object({
  username: z.string(),
  password: z.string(),
  gender: z.enum(['Male', 'Female', 'Others']),
  channelName: z.string().min(3).max(50)
})
const signinSchema = z.object({
  username: z.string(),
  password: z.string().min(8).max(30),
})
const uploadSchema = z.object({
  videourl: z.url(),
  thumbnail: z.url()
})

const videoIdCheck = z.string().uuid()

app.post('/api/signup', async (req, res) => {
  const parsedSignupBody = signupSchema.safeParse(req.body)
  if (!parsedSignupBody.success) {
    res.status(400).json({
      error: parsedSignupBody.error.message
    })
    return;
  }
  const { username, password, gender, channelName } = parsedSignupBody.data
  const existingUser = await prisma.user.findFirst({ where: { username } });
  if (existingUser) {
    res.status(409).json({
      error: "Username already exists"
    })
    return;
  }
  const hashedpassword = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: {
      username: username,
      password: hashedpassword,
      gender: gender,
      channelName: channelName
    }
  })
  const token = generatedToken(user.id)
  res.status(201).json({
    username, token
  })
})

app.post('/api/signin', async (req, res) => {
  const parsedSigninbody = signinSchema.safeParse(req.body)
  if (!parsedSigninbody.success) {
    res.status(400).json({
      error: parsedSigninbody.error.message
    })
    return;
  }
  const { username, password } = parsedSigninbody.data

  const isUserExists = await prisma.user.findFirst({ where: { username } });
  if (!isUserExists) {
    res.status(400).json({
      error: "user does not exists , don't have an account ?sign up"
    })
    return;
  }
  const validUserCheck = await bcrypt.compare(password, isUserExists.password)

  if (!validUserCheck) {
    res.status(400).json({
      error: "Incorrect password"
    })
    return;
  }

  const token = generatedToken(isUserExists.id);
  res.status(201).json({
    username, token
  })
})
app.get('/api/videos',async (_req, res)=>{

  try{
      const allVideos= await prisma.uploads.findMany({
     include:{user : {select:{id:true, channelName:true, profilePicture:true}}},
     orderBy: {createdAt:'desc'}
   })
   if(!allVideos){
    res.status(200).json({
      message: 'no videos available'
    })
    return;
   }
   res.status(200).json({
    allVideos
   })
  }catch(e){
    logger
    res.status(500).json({
      error:'not able to load them right now'
    })
  }
   
})

app.get('/api/video/:id', async (req, res)=>{
  try{
    const videoId= req.params.id
    const parsedId= videoIdCheck.safeParse(videoId)
    if(!parsedId.success){
      return res.status(400).json({
        message: parsedId.error.message
      })
    }
    const parsedVideoId = parsedId.data

    const video= await prisma.uploads.findUnique({
      where: {id: parsedVideoId},
      include:{user: {select :{id:true, channelName:true, profilePicture:true}}}
    })
    
    if(!video){
      logger.warn({videoId:parsedVideoId}, "video not found")
      return res.status(404).json({
        message : 'Video not found'
      })
    }
    res.json(video)

  }catch(e){
    logger.error({err: e},'failed to fetch the data')
    return res.status(500).json({
      message:'server error'
    })
  }
})

app.post('/api/videos',async (req, res)=>{
  try{
    const userId= getUserId(req)
  if(!userId){
    return res.status(401).json({
      message: "userId is unauthorized"
    })
  }
  const videoBody= await req.body
  const parseVideo = uploadSchema.safeParse(videoBody)
  if(!parseVideo.success){
    logger.warn({parseVideo}, "proper video links are not available")
    return res.status(400).json({
      error : parseVideo.error.message
    })
  }
  const uploadVideo= await prisma.uploads.create({
    data:{...parseVideo.data, userId:userId}, //fwe
  })
  res.status(201).json(uploadVideo)
  }catch(e){
    logger.error({err: e}, 'falid to fetch the data')
    return res.status(500).json({
      message:'internal server error'
    })
  }
  
})

app.delete('/api/videos/:id',async (req, res)=>{
  try{
    const userId = getUserId(req)

    if(!userId){
      return res.status(401).json({
        message:"user is unauthorized"
      })
    }
    const videoId = 

  }catch(e){
    logger.error({error: e},"not able get the information server is down")
    return res.status(500).json({
      message:'internal server error'
    })
  }
  
})
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
