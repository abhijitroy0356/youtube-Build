import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import z, { email, length, minLength } from 'zod'
import { prisma } from './db';
import bcrypt from 'bcryptjs'
import { generatedToken } from './middleware/auth';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
const JWT_SECRET = process.env.JWT_SECRET



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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
