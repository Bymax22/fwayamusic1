// src/upload/types.ts
import { Request } from 'express';

export type FileFilterCallback = (error: Error | null, acceptFile: boolean) => void;
export type FilenameCallback = (error: Error | null, filename: string) => void;