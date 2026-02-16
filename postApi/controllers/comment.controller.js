const User = require("../models/user.model");
const Post = require("../models/post.model");
const Comment= require("../models/comment")
const { asyncWrapper } = require("../middlewares/errors");

const createComment=asyncWrapper(async(req,res)=>{
    const {body,post}=req.body
    const comment= new Comment({
        body,
        author: req.user.id,
        post
    })
    await comment.save()
    res.status(201).json({ message: "Comment created successfully", comment });
})

const updateComment=asyncWrapper(async(req,res)=>{
    const {body}=req.body
    const comment= await Comment.findById(req.params.id)
    if(!comment){
        const error = new Error("Comment not found");
        error.status = 404;
        throw error;
    }
    if(comment.author.toString()!==req.user.id){
        const error = new Error("You are not authorized to update this comment");
        error.status = 403;
        throw error;
    }
    const updatedComment= await Comment.findByIdAndUpdate(req.params.id,req.body,{new:true})
    res.status(200).json({ message: "Comment updated successfully", updatedComment });
})

const deleteComment=asyncWrapper(async(req,res)=>{
    const comment= await Comment.findById(req.params.id)
    if(req.user.role==="admin"){
        await comment.remove()
        res.status(200).json({ message: "Comment deleted successfully" });
    }
    if(!comment){
        const error = new Error("Comment not found");
        error.status = 404;
        throw error;
    }
    if(comment.author.toString()!==req.user.id){
        const error = new Error("You are not authorized to delete this comment");
        error.status = 403;
        throw error;
    }
    await comment.remove()
    res.status(200).json({ message: "Comment deleted successfully" });
})

const getComments=asyncWrapper(async(req,res)=>{
    const comments= await Comment.find({post:req.params.id})
    const authorData= await User.findById(comments.author).select("username avatar")
    res.status(200).json({ comments,authorData });
})

module.exports= {
    createComment,
    updateComment,
    deleteComment,
    getComments
}
