import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import apiRoutes from './routes/routes';

dotenv.config();

const app = express();
const port = 8080;

app.use(cors());
app.use(express.json());
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("GLOBAL ERROR HANDLER CAUGHT:", err); 
  res.status(500).json({ 
      message: 'An internal server error occurred.', 
      details: err.message 
  });
});
app.use('/api', apiRoutes);

app.listen(port, () => {
  console.log(`Backend server running at http://localhost:${port}`);
});