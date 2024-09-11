import express, { Request, Response } from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 2138;

app.get('/', (_, res: Response) => {
  res.send('Hello!');
});

app.get('/health', (_, res: Response) => {
  res.status(200).json({ message: 'ok' });
})

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});