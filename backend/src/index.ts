import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import z, { email, length, minLength } from 'zod'
import { prisma } from './db';
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
const JWT_SECRET = process.env.JWT_SECRET

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in .env")
}

// Routes will go here
const signupSchema = z.object({
  username: z.string(),
  password: z.string(),
  gender: z.enum(['Male', 'Female', 'Other']),
  channelName: z.string().min(3).max(50)
})
const signinSchema = z.object({
  username: z.string(),
  password: z.string().min(8).max(30),
})
const uploadSchema = z.object({
  videoUrl: z.url(),
  thumbnail: z.url()
})
app.post('/api/signup', async (req: Request, res: Response) => {
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
  const token = jwt.sign({ userId: user.id }, JWT_SECRET)
  res.status(201).json({
    token, userId: user.id
  })
})

app.post('/api/signin', async (req: Request, res: Response) => {
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
  const isPasswordValid = await bcrypt.compare(password, isUserExists.password);
  if (!isPasswordValid) {
    res.status(401).json({
      error: "Invalid password"
    })
    return;
  }
  const token = jwt.sign({ userId: isUserExists.id }, JWT_SECRET)
  res.status(200).json({
    token, userId: isUserExists.id
  })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
