export interface User {
    id: string;
    username: string;
    password: string;
    email: string;
    createdAt: Date;
}

export interface Post {
    id: string;
    title: string;
    content: string;
    authorId: string;
    createdAt: Date;
    updatedAt: Date;
    fileUrl?: string; // Optional field for file uploads
}