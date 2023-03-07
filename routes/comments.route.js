const express = require('express');
const { Posts, Comments } = require('../models');
const authMiddleware = require('../middlewares/auth-middleware');
const router = express.Router();

/**
 * name : 댓글 조회
 * description : post에 해당하는 댓글 리스트를 조회한다.
 * writer : Jay Choi
 * date : 2023.03.07
 */
router.get('/comments/:postId', authMiddleware, async (req, res) => {
  const { postId } = req.params;

  const post = await Posts.findOne({ whrer: { id: postId } });
  if (!post) {
    res.status(404).json({ message: '게시물이 존재하지 않습니다.' });
  }

  const comments = await Comments.findAll({
    where: { postId },
    order: [['createdAt', 'DESC']],
  });
  return res.status(200).json({ data: comments });
});

/**
 * name : 댓글 등록
 * description : user가 입력한 댓글을 등록한다.
 * writer : Jay Choi
 * date : 2023.03.07
 */
router.post('/comment', authMiddleware, async (req, res) => {
  const userId = res.locals.user.id;

  const { postId, comment } = req.body;

  // 포스트를 조회함
  const post = await Posts.findOne({ where: { id: postId } });

  if (!post) {
    return res.status(404).json({ message: '게시글이 존재하지 않습니다.' });
  }

  const resComment = await Comments.create({
    postId,
    writerId: userId,
    contents: comment,
  });

  return res.status(201).json({ data: resComment });
});

module.exports = router;
