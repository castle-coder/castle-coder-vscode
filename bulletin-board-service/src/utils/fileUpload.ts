import multer from 'multer';
import path from 'path';

// Set up storage configuration for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Specify the directory to save uploaded files
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname)); // Create a unique filename
  }
});

// Configure multer for file uploads
const upload = multer({ storage: storage });

// Export the configured upload function
export const configureFileUpload = (fieldName: string) => {
  return upload.single(fieldName); // Use single file upload for the specified field
};