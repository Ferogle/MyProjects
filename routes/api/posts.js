const express = require('express');
const { check, validationResult } = require('express-validator');
const Post = require('../../models/Post');
const Profile = require('../../models/Profile');
const User = require('../../models/User');
const auth = require('../../middleware/auth');
const { exists } = require('../../models/User');

const router = express.Router();

//@route    POST /api/posts
//@desc     create a post
//@access   private

router.post(
  '/',
  [auth, [check('text', 'Post cannot be empty').exists()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id).select('-password');

      const newPost = new Post({
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      });

      const post = await newPost.save();

      res.json(post);
    } catch (err) {
      console.error(err);
      res.status(400).send('server error');
    }
  }
);

//@route    GET /api/posts
//@desc     get all posts
//@access   private

router.get('/', auth, async (req, res) => {
  try {
    const posts = await Post.find().sort({ date: -1 });
    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(400).send('server error');
  }
});

//@route    GET /api/posts/:post_id
//@desc     get post by id
//@access   private

router.get('/:post_id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);
    if (!post) return res.status(404).json({ msg: 'Post not found' });
    res.json(post);
  } catch (err) {
    if (err.kind === 'ObjectId')
      res.status(404).json({ msg: 'Post not found' });
    console.error(err);
    res.status(400).send('server error');
  }
});

//@route    DELETE /api/posts/:post_id
//@desc     delete post
//@access   private

router.delete('/:post_id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);

    if (!post) return res.status(404).json({ msg: 'Post not found' });

    if (post.user.toString() !== req.user.id) {
      res.status(400).json({ msg: 'User not authorized' });
    }

    await post.remove();

    res.json({ msg: 'post deleted' });
  } catch (err) {
    if (err.kind === 'ObjectId')
      res.status(404).json({ msg: 'Post not found' });
    console.error(err);
    res.status(400).send('server error');
  }
});

//@route    PUT /api/posts/like/:post_id
//@desc     like post
//@access   private

router.put('/like/:post_id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);

    if (!post) return res.status(404).json({ msg: 'Post not found' });

    if (
      post.likes.filter((like) => like.user.toString() === req.user.id).length >
      0
    ) {
      return res.status(400).json({ msg: 'Post already liked' });
    }

    const newLike = {
      user: req.user.id,
    };
    post.likes.unshift(newLike);

    await post.save();

    res.json(post.likes);
  } catch (err) {
    if (err.kind === 'ObjectId')
      res.status(404).json({ msg: 'Post not found' });
    console.error(err);
    res.status(400).send('server error');
  }
});

//@route    PUT /api/posts/unlike/:post_id
//@desc     unlike post
//@access   private

router.put('/unlike/:post_id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);

    if (!post) return res.status(404).json({ msg: 'Post not found' });

    if (
      post.likes.filter((like) => like.user.toString() === req.user.id)
        .length === 0
    ) {
      return res.status(400).json({ msg: 'Post not liked' });
    }

    post.likes = post.likes.filter(
      (like) => like.user.toString() !== req.user.id
    );

    await post.save();

    res.json(post.likes);
  } catch (err) {
    if (err.kind === 'ObjectId')
      res.status(404).json({ msg: 'Post not found' });
    console.error(err);
    res.status(400).send('server error');
  }
});

//@route    PUT /api/posts/comment/:post_id
//@desc     comment on a post
//@access   private

router.put(
  '/comment/:post_id',
  [auth, [check('text', 'Text is required').exists()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const post = await Post.findById(req.params.post_id);

      if (!post) return res.status(404).json({ msg: 'Post not found' });

      const user = await User.findById(req.user.id).select('-password');

      const newCom = {
        user: req.user.id,
        text: req.body.text,
        avatar: user.avatar,
        name: user.name,
      };

      post.comments.unshift(newCom);

      await post.save();

      res.json(post.comments);
    } catch (err) {
      if (err.kind === 'ObjectId')
        res.status(404).json({ msg: 'Post not found' });
      console.error(err);
      res.status(400).send('server error');
    }
  }
);

//@route    DELETE /api/posts/comment/:post_id/:comment_id
//@desc     delete a comment
//@access   private

router.delete('/comment/:post_id/:comment_id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);

    if (!post) return res.status(404).json({ msg: 'Post not found' });

    const user = await User.findById(req.user.id).select('-password');

    if (post.user.toString() !== req.user.id)
      return res.status(400).json({ msg: 'User not authorized' });

    post.comments = post.comments.filter(
      (comment) => comment.id.toString() !== req.params.comment_id
    );

    await post.save();

    res.json(post.comments);
  } catch (err) {
    if (err.kind === 'ObjectId')
      res.status(404).json({ msg: 'Post not found' });
    console.error(err);
    res.status(400).send('server error');
  }
});

module.exports = router;
