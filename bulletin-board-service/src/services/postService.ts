import { Post } from '../models/postModel';
import { Request, Response } from 'express';

export class PostService {
    async createPost(req: Request, res: Response) {
        const { title, content } = req.body;
        const file = req.file;

        const newPost = new Post({
            title,
            content,
            filePath: file ? file.path : null,
        });

        await newPost.save();
        return newPost;
    }

    async getPosts(req: Request, res: Response) {
        const posts = await Post.find();
        return posts;
    }

    async deletePost(req: Request, res: Response) {
        const { id } = req.params;
        await Post.findByIdAndDelete(id);
        return { message: 'Post deleted successfully' };
    }
}