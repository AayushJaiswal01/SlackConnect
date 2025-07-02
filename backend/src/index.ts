import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import apiRoutes from './routes/routes';

dotenv.config();

const app = express();
const port = 8080;

app.use(cors());
app.use(express.json());
app.use('/api', apiRoutes);

app.listen(port, () => {
  console.log(`Backend server running at http://localhost:${port}`);
});