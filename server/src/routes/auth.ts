import { Router, Request, Response } from 'express';
import supabase from '@/lib/supabaseClient';

const router: Router = Router();

// Signup endpoint
router.post('/signup', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  // Consider what to return: user object, session, or just success
  return res.status(200).json({ message: 'Signup successful. Check your email for verification.', user: data.user });
});

// Login endpoint
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  // Return session details (including access token and refresh token)
  return res.status(200).json({ session: data.session });
});

// Logout endpoint (optional, as Supabase handles sessions client-side mainly)
// Supabase client SDK handles signout: supabase.auth.signOut()
// This endpoint could be used for server-side session cleanup if needed
router.post('/logout', async (req: Request, res: Response) => {
    // In a real scenario, you might invalidate server-side tokens if used.
    // For Supabase client-side focus, this might just return success.
    return res.status(200).json({ message: 'Logout successful (client should clear session)'});
});


export default router; 