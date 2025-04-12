import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import authRoutes from '@/routes/auth'; // Import auth routes

dotenv.config(); // Ensure env variables are loaded

const app: Express = express();
const port: number = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

// Middleware
app.use(express.json()); // Parse JSON bodies

// Routes
app.use('/api/auth', authRoutes); // Mount auth routes under /api/auth

app.get('/', (req: Request, res: Response) => {
  res.send('Express + TypeScript Server - Base Route');
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
}); 