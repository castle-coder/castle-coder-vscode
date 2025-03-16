import { Request, Response } from 'express';
import PostService from '../services/postService';

class PostController {
    private postService: PostService;

    constructor() {
        this.postService = new PostService();
    }

    public createPost = async (req: Request, res: Response): Promise<void> => {
        try {
            const postData = req.body;
            const file = req.file; // Assuming file upload middleware is used
            const newPost = await this.postService.createPost(postData, file);
            res.status(201).json(newPost);
        } catch (error) {
            res.status(500).json({ message: 'Error creating post', error });
        }
    };

    public getPosts = async (req: Request, res: Response): Promise<void> => {
        try {
            const posts = await this.postService.getPosts();
            res.status(200).json(posts);
        } catch (error) {
            res.status(500).json({ message: 'Error retrieving posts', error });
        }
    };

    public deletePost = async (req: Request, res: Response): Promise<void> => {
        try {
            const postId = req.params.id;
            await this.postService.deletePost(postId);
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ message: 'Error deleting post', error });
        }
    };
}

export default PostController;