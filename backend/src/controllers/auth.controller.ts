import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { sendSuccess, sendCreated, sendError } from '../utils/response';
import { config } from '../config/config';

export const register = async (req: Request, res: Response) => {
  const user = await authService.register(req.body);
  req.audit?.('REGISTER', 'User', user.id);
  sendCreated(res, user, 'Registration successful. Please verify your email.');
};

export const login = async (req: Request, res: Response) => {
  const result = await authService.login(req.body);

  // Set refresh token in HTTP-only cookie
  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: config.env === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  // @ts-ignore
  req.audit?.('LOGIN', 'User', result.user.id);
  sendSuccess(res, { accessToken: result.accessToken, user: result.user }, 'Login successful');
};

export const refresh = async (req: Request, res: Response) => {
  const { refreshToken } = req.cookies;
  if (!refreshToken) {
    return sendError(res, 'No refresh token provided', 401);
  }

  const result = await authService.refreshTokens(refreshToken);

  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: config.env === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  sendSuccess(res, { accessToken: result.accessToken }, 'Token refreshed');
};

export const logout = async (req: Request, res: Response) => {
  const { refreshToken } = req.cookies;
  if (refreshToken) {
    await authService.logout(refreshToken);
    res.clearCookie('refreshToken');
  }
  // @ts-ignore
  req.audit?.('LOGOUT', 'User', req.user?.id);
  sendSuccess(res, null, 'Logged out successfully');
};

export const verifyEmail = async (req: Request, res: Response) => {
  const { token } = req.query;
  if (!token || typeof token !== 'string') {
    return sendError(res, 'Token is required', 400);
  }
  await authService.verifyEmail(token);
  sendSuccess(res, null, 'Email verified successfully');
};

export const forgotPassword = async (req: Request, res: Response) => {
  await authService.forgotPassword(req.body.email);
  sendSuccess(res, null, 'If that email exists, a reset link has been sent');
};

export const resetPassword = async (req: Request, res: Response) => {
  await authService.resetPassword(req.body.token, req.body.password);
  sendSuccess(res, null, 'Password reset successful');
};
