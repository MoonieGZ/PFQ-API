import {Request} from 'express'
import User from '../types/user'

export interface AuthenticatedRequest extends Request {
  user?: User;
}