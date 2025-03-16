import { Router } from 'express';
import { PostController } from '../controllers/postController';
import { configureFileUpload } from '../utils/fileUpload';

const router = Router();
const postController = new PostController();

// Middleware for file upload
router.use(configureFileUpload());

// Route for creating a post
router.post('/', postController.createPost.bind(postController));

// Route for retrieving all posts
router.get('/', postController.getPosts.bind(postController));

// Route for deleting a post
router.delete('/:id', postController.deletePost.bind(postController));

export function setPostRoutes(app) {
    app.use('/api/posts', router);
}