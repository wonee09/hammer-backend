const express = require('express');
const { Posts, Likes } = require('../models');
const authMiddleware = require('../middlewares/auth-middleware');
const router = express.Router();

/**
 * name : 좋아요 등록
 * description : user가 입력한 좋아요를 등록한다.
 * writer : Jay Choi
 * date : 2023.03.07
 */
router.post('/likes/:id', authMiddleware, async (req, res) => {
  const userId = res.locals.user.id;
  const { id: postId } = req.params; // 스로틀링 디바운싱을 통해 likeYn은 하나만 받아야 함
  const { likeYn } = req.body; // 스로틀링 디바운싱을 통해 likeYn은 하나만 받아야 함

  // 포스트 조회
  const post = await Posts.findOne({ where: { id: postId } });

  if (!post) {
    return res.status(404).json({ message: '게시글이 존재하지 않습니다.' });
  }

  // 해당 postId로 생성되어있는 좋아요가 이미 있는지 확인
  const like = await Likes.findOne({
    where: { postId, userId },
  });

  if (!like) {
    // create
    await Likes.create({
      likeYn,
      postId,
      userId,
    });
    res.status(201).json({ data: '좋아요 등록이 완료되었습니다.' });
  } else {
    await Likes.update(
      { likeYn: likeYn },
      {
        where: {
          id: like.id,
        },
      }
    );

    res.status(201).json({ data: '좋아요 수정이 완료되었습니다.' });
  }
});

module.exports = router;
