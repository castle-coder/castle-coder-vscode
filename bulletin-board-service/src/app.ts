import express from 'express';
import bodyParser from 'body-parser';
import setAuthRoutes from './routes/authRoutes';
import { setPostRoutes } from './routes/postRoutes';
import mongoose from 'mongoose';
import { configureFileUpload } from './utils/fileUpload';
import { Express } from 'express';

export function configureAppFileUpload(app: Express) {
    // File upload configuration code
}

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
configureAppFileUpload(app);

// Database connection
mongoose.connect('mongodb://localhost:27017/bulletin-board', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
} as mongoose.ConnectOptions)
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
setAuthRoutes(app);
setPostRoutes(app);

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});