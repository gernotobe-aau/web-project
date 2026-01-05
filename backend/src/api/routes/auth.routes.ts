import { Router, Request, Response } from 'express';

const router = Router();

// POST /api/auth/login
router.post('/login', (req: Request, res: Response) => {
  res.status(501).json({ 
    error: 'Not implemented yet',
    message: 'Login endpoint will be implemented in a future sprint'
  });
});

// POST /api/auth/register
router.post('/register', (req: Request, res: Response) => {
  res.status(501).json({ 
    error: 'Not implemented yet',
    message: 'Register endpoint will be implemented in a future sprint'
  });
});

export default router;
