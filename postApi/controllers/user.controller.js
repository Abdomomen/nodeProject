const User = require("../models/user.model");
const Post = require("../models/post.model");
const Comment = require("../models/comment");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { asyncWrapper } = require("../middlewares/errors");
const generateToken = require("../services/jwtProvider");

const registerUser = asyncWrapper(async (req, res) => {
  let { username, email, password, avatar } = req.body;
  if (req.file) {
    avatar = req.file.filename;
  }
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const error = new Error("Email already in use");
    error.status = 400;
    throw error;
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({
    username,
    email,
    password: hashedPassword,
    avatar,
  });
  await user.save();
  const token = generateToken({
    email: user.email,
    id: user._id,
    role: user.role,
  });
  res.status(201).json({ message: "User registered successfully", token });
});

const loginUser = asyncWrapper(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    const error = new Error("Invalid email or password");
    error.status = 401;
    throw error;
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const error = new Error("Invalid email or password");
    error.status = 401;
    throw error;
  }
  const token = generateToken({
    email: user.email,
    id: user._id,
    role: user.role,
  });
  res.json({ message: "Login successful", token });
});

const friendsList = asyncWrapper(async (req, res) => {
  const userId = req.user.id;
  const user = await User.findById(userId).populate(
    "friends",
    "username email avatar",
  );
  res.json({ friends: user.friends });
});

const addFriend = asyncWrapper(async (req, res) => {
  const userId = req.user.id;
  const friendId = req.params.friendId;
  if (userId === friendId) {
    const error = new Error("You cannot add yourself as a friend");
    error.status = 400;
    throw error;
  }
  const user = await User.findById(userId);
  const friend = await User.findById(friendId);
  if (!friend) {
    const error = new Error("Friend not found");
    error.status = 404;
    throw error;
  }
  if (user.friends.includes(friendId)) {
    const error = new Error("Friend already added");
    error.status = 400;
    throw error;
  }
  friend.friendsrequests.push(userId);
  await friend.save();
  res.json({ message: "Friend request sent successfully" });
});

const removeFriend = asyncWrapper(async (req, res) => {
  const userId = req.user.id;
  const friendId = req.params.friendId;
  const user = await User.findById(userId);
  const friend = await User.findById(friendId);
  if (!friend) {
    const error = new Error("Friend not found");
    error.status = 404;
    throw error;
  }
  if (!user.friends.includes(friendId)) {
    const error = new Error("Friend not in your friends list");
    error.status = 400;
    throw error;
  }
  user.friends = user.friends.filter((id) => id.toString() !== friendId);
  await user.save();
  friend.friends = friend.friends.filter((id) => id.toString() !== userId);
  await friend.save();
  res.json({ message: "Friend removed successfully" });
});

const relationalFriends = asyncWrapper(async (req, res) => {
  const userId = req.user.id;
  const user = await User.findById(userId).populate({
    path: "friends",
    select: "username email avatar",
  });
  const friendsOfFriends = await User.find({
    _id: { $in: user.friends.map((friend) => friend._id) },
    friends: { $ne: userId },
  }).select("username email avatar");
  res.json({ friendsOfFriends });
});

const searchUsers = asyncWrapper(async (req, res) => {
  const { username } = req.query;
  const users = await User.find({ username: new RegExp(username, "i") }).select(
    "username email avatar",
  );
  res.json({ users });
});

const deleteUser = asyncWrapper(async (req, res) => {
  const role = req.user.role;
  if (role !== "admin") {
    const error = new Error("You do not have permission to delete users");
    error.status = 403;
    throw error;
  }
  const userId = req.params.userId;
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }

  // Remove user from friends' lists
  await Promise.all(
    user.friends.map(async (friendId) => {
      const friend = await User.findById(friendId);
      if (friend) {
        friend.friends = friend.friends.filter(
          (id) => id.toString() !== userId,
        );
        await friend.save();
      }
    }),
  );

  // Delete all user posts
  await Post.deleteMany({ _id: { $in: user.posts } });

  await Comment.deleteMany({ author: userId });
  await User.deleteOne({ _id: userId });
  res.json({ message: "User deleted successfully" });
});

const getFriendsRequests = asyncWrapper(async (req, res) => {
  const userId = req.user.id;
  const user = await User.findById(userId).populate("friendsrequests", "username email avatar");
  res.json({ friendsRequests: user.friendsrequests });
});
const acceptFriendRequest = asyncWrapper(async (req, res) => {
  const userId = req.user.id;
  const requesterId = req.params.requesterId;
  const user = await User.findById(userId);
  const requester = await User.findById(requesterId);
  if (req.body.method !== "accept") {
    user.friendsrequests = user.friendsrequests.filter(
      (id) => id.toString() !== requesterId,
    );
    await user.save();
    res.json({ message: "Friend request rejected successfully" });
    return;
  }
  if (!requester) {
    const error = new Error("Requester not found");
    error.status = 404;
    throw error;
  }
  if (!user.friendsrequests.includes(requesterId)) {
    const error = new Error("No friend request from this user");
    error.status = 400;
    throw error;
  }
  user.friends.push(requesterId);
  user.friendsrequests = user.friendsrequests.filter(
    (id) => id.toString() !== requesterId,
  );
  await user.save();
  requester.friends.push(userId);
  await requester.save();
  res.json({ message: "Friend request accepted successfully" });
});

const getFriendProfile = asyncWrapper(async (req, res) => {
  const friendId = req.params.friendId;
  const user = await User.findById(req.user.id);
  if (!user.friends.includes(friendId)) {
    const error = new Error("This user is not your friend");
    error.status = 403;
    throw error;
  }
  const friend = await User.findById(friendId);
  res.json({ friend });
});

module.exports = {
  registerUser,
  loginUser,
  friendsList,
  addFriend,
  removeFriend,
  relationalFriends,
  searchUsers,
  deleteUser,
  getFriendsRequests,
  acceptFriendRequest,
};
