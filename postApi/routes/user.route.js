const router = require("express");
const verifyJWT = require("../middlewares/verifyJWT");
const userRouter = router.Router();
const upload = require("../middlewares/user.profile");

const {
  registerValidation,
  loginValidation,
} = require("../validation/user.validation");
const validate = require("../middlewares/validate");
const {
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
} = require("../controllers/user.controller");

userRouter.post(
  "/register",
  upload.single("avatar"),
  registerValidation,
  validate,
  registerUser,
);
userRouter.post("/login", loginValidation, validate, loginUser);
userRouter.get("/friends", verifyJWT, friendsList);
userRouter.post("/friends/:friendId", verifyJWT, addFriend);
userRouter.delete("/friends/:friendId", verifyJWT, removeFriend);
userRouter.get("/relational-friends", verifyJWT, relationalFriends);
userRouter.get("/search", verifyJWT, searchUsers);
userRouter.delete("/delete/:userId", verifyJWT, deleteUser);
userRouter.get("/friends-requests", verifyJWT, getFriendsRequests);
userRouter.post(
  "/friends-requests/:requesterId",
  verifyJWT,
  acceptFriendRequest,
);

module.exports = userRouter;
