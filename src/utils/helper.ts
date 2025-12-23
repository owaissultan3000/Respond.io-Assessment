import type { Response } from 'express';

export const sendError = (res: Response, status: number, message: string) => {
    return res.status(status).json({ success: false, message });
};

export const sendSuccess = (res: Response, status: number, message: string, data?: any) => {
    return res.status(status).json({ success: true, message, data });
};