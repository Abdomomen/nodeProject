const User = require("../models/user.model");
const Post = require("../models/post.model");
const Comment = require("../models/comment");
const { asyncWrapper } = require("../middlewares/errors");
const createPost = asyncWrapper(async (req, res) => {
  let { title, content, images, comments, role } = req.body;
  if (req.files) {
    images = req.files.map((file) => file.filename);
  }
  const post = new Post({
    title,
    content,
    author: req.user.id,
    images,
    comments,
    role,
  });
  await post.save();
  res.status(201).json({ message: "Post created successfully", post });
});

const updatePost = asyncWrapper(async (req, res) => {
  const user = req.user.id;
  const post = await Post.findById(req.params.id);
  if (!post) {
    const error = new Error("Post not found");
    error.status = 404;
    throw error;
  }
  if (post.author.toString() !== user) {
    const error = new Error("You are not authorized to update this post");
    error.status = 403;
    throw error;
  }
  const updatedPost = await Post.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  res.status(200).json({ message: "Post updated successfully", updatedPost });
});

const deletePost = asyncWrapper(async (req, res) => {
  const role = req.user.role;
  if (role === "admin") {
    const post = await Post.findById(req.params.id);
    if (!post) {
      const error = new Error("Post not found");
      error.status = 404;
      throw error;
    }
    await Post.findByIdAndDelete(req.params.id);
    return res.status(200).json({ message: "Post deleted successfully" });
  }
  const user = req.user.id;
  const post = await Post.findById(req.params.id);
  if (!post) {
    const error = new Error("Post not found");
    error.status = 404;
    throw error;
  }
  if (post.author.toString() !== user) {
    const error = new Error("You are not authorized to delete this post");
    error.status = 403;
    throw error;
  }
  await Post.findByIdAndDelete(req.params.id);
  res.status(200).json({ message: "Post deleted successfully" });
});

const getMyPosts = asyncWrapper(async (req, res) => {
  const posts = await Post.find({ author: req.user.id });
  res.status(200).json({ posts });
});

const getFriendPosts = asyncWrapper(async (req, res) => {
  const user = await User.findById(req.user.id).select("friends");
  if(!user.friends.includes(req.params.id)){
    const error = new Error("You are not authorized to see this friend's posts");
    error.status = 403;
    throw error;
  }
  const posts = await Post.find({ author: req.params.id });
  res.status(200).json({ posts });
});


const getFriendsPosts = asyncWrapper(async (req, res) => {
  const friends = await User.findById(req.user.id).select("friends");
  const posts = await Post.find({ author: { $in: friends.friends } });
  res.status(200).json({ posts });
});

const getAllPosts = asyncWrapper(async (req, res) => {
  if (req.user.role !== "admin") {
    const error = new Error("You are not authorized to get all posts");
    error.status = 403;
    throw error;
  }
  const posts = await Post.find();
  res.status(200).json({ posts });
});

module.exports = {
  createPost,
  updatePost,
  deletePost,
  getMyPosts,
  getFriendsPosts,
  getAllPosts,
};
