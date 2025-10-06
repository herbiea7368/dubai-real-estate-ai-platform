import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname } from 'path';

export const multerOptions = {
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (_req: any, file: Express.Multer.File, cb: any) => {
    const allowedMimeTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new BadRequestException(
          'Unsupported file type. Only PDF, JPEG, JPG, and PNG are allowed.',
        ),
        false,
      );
    }
  },
  storage: diskStorage({
    destination: './uploads/documents',
    filename: (_req, file, cb) => {
      const randomName = Array(32)
        .fill(null)
        .map(() => Math.round(Math.random() * 16).toString(16))
        .join('');
      cb(null, `${randomName}${extname(file.originalname)}`);
    },
  }),
};
