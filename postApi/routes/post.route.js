const router = require("express");
const postRouter = router.Router();
const {
  createPost,
  updatePost,
  deletePost,
  getMyPosts,
  getFriendsPosts,
  getAllPosts,
} = require("../controllers/post.controller");
const verifyJWT = require("../middlewares/verifyJWT");
const postValidation = require("../validation/post.validation");
const upload = require("../middlewares/postUploader");
const validate = require("../middlewares/validate");

postRouter.post(
  "/",
  verifyJWT,
  upload.array("images", 10),
  postValidation,
  validate,
  createPost,
);
postRouter.put(
  "/:id",
  verifyJWT,
  upload.array("images", 10),
  postValidation,
  validate,
  updatePost,
);
postRouter.delete("/:id", verifyJWT, deletePost);
postRouter.get("/:id", verifyJWT, getMyPosts);
postRouter.get("/friends", verifyJWT, getFriendsPosts);
postRouter.get("/all", verifyJWT, getAllPosts);

module.exports = postRouter;
