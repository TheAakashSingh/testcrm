import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import authRouter from './routes/auth';
import usersRouter from './routes/users';
import leadsRouter from './routes/leads';
import activitiesRouter from './routes/activities';
import { setIo } from './socket';
import { PrismaClient } from './generated/prisma';

const prisma = new PrismaClient();
const app = express();
const server = createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
setIo(io);

const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/leads', leadsRouter);
app.use('/api/activities', activitiesRouter);

io.on('connection', (socket) => {
  console.log('a user connected');
});

app.get('/', (req, res) => {
  res.send('CRM Backend API');
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});