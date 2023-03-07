const express = require('express');
const { Op } = require('sequelize');
const { Posts, Comments, Likes } = require('../models');
const authMiddleware = require('../middlewares/auth-middleware');
const router = express.Router();

/**
 * name : 게시글 목록 전체를 조회
 * description : 검색어가 있는 경우 like 검색을 실시하여 검색결과만 조회한다.
 * writer : Jay Choi
 * date : 2023.03.07
 */
router.get('/posts', authMiddleware, async (req, res) => {
  const { id: userId } = res.locals.user;

  // query params를 두개로 분리
  const partials = req.url.split('?')[1].split('&');

  // 각각의 parameter(주소ID, 검색어)로 분리
  const idParam = partials[0].split('=')[1];
  const encodedSearchParam = partials[1].split('=')[1];

  // 검색어
  const searchParam = decodeURIComponent(encodedSearchParam);

  // 게시물 리스트
  const posts = await Posts.findAll({
    where: searchParam
      ? { addressId: idParam, title: { [Op.like]: `%${searchParam}%` } }
      : { addressId: idParam },
    order: [['createdAt', 'DESC']],
  });

  // Comments Count 구하기
  const postsCommentCountList = await Promise.all(
    posts.map((post) => {
      return Comments.findAll({
        where: { postId: post.id },
      });
    })
  );
  const resultList = postsCommentCountList.map((item) => {
    return item.length;
  });

  // 접속한 user, postid에 해당하는 좋아요
  const likeList = await Promise.all(
    posts.map((post) => {
      return Likes.findOne({
        where: { postId: post.id, userId },
      });
    })
  );

  // 응답 조합
  const response = posts.map((post, index) => {
    return {
      ...post.dataValues,
      writerName: res.locals.user.nickName,
      replyCount: resultList[index],
      realLikeYn: likeList[index]?.dataValues.likeYn,
    };
  });

  return res.status(200).json({ data: response });
});

/**
 * name : 주소별 글 목록 조회
 * description : 주소 1개당 등록되어 있는 post 목록을 조회한다.
 * writer : Jay Choi
 * date : 2023.03.07
 */
router.get('/posts/:addressId', authMiddleware, async (req, res) => {
  const { addressId, searchValue } = req.params;
  const posts = await Posts.findAll({
    where: { addressId },
    order: [['createdAt', 'DESC']],
  });

  const response = posts.map((post) => {
    return { ...post.dataValues, writerName: res.locals.user.nickName };
  });

  return res.status(200).json({ data: response });
});

// 게시글 생성
router.post('/posts', authMiddleware, async (req, res) => {
  const { id: userId } = res.locals.user;
  // 게시글 관련 정보
  const { title, contents, addressId } = req.body;

  const post = await Posts.create({
    writerId: userId,
    title,
    contents,
    addressId,
    likes: 0,
    hits: 0,
  });

  // 좋아요 테이블에 default로 생성
  await Likes.create({
    likeYn: false,
    postId: post.id,
    userId,
  });

  return res.status(201).json({ data: post });
});

/**
 * name : 게시글 수정
 * description : post를 수정한다.
 * writer : Jay Choi
 * date : 2023.03.07
 */
router.patch('/posts/:id', authMiddleware, async (req, res) => {
  const { id: postId } = req.params;
  const { title, contents } = req.body;

  // 현재 userId가 해당 post의 userId와 일치하는지 확인
  const { id: userId } = res.locals.user;

  // post get
  const post = await Posts.findOne({
    where: {
      id: postId,
    },
  });

  if (!post) {
    return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
  } else if (post.writerId !== userId) {
    return res
      .status(401)
      .json({ message: '해당 post를 수정할 권한이 없는 user입니다.' });
  }

  await Posts.update(
    { title, contents },
    {
      where: {
        id: postId,
      },
    }
  );

  return res.status(200).json({ data: '수정되었습니다.' });
});

/**
 * name : 조회수 증가
 * description : 열람할 시 조회수를 +1 처리
 * writer : Jay Choi
 * date : 2023.03.07
 */
router.patch('/posts/hits/:id', async (req, res) => {
  const { id: postId } = req.params;

  // post get
  const post = await Posts.findOne({
    where: {
      id: postId,
    },
  });

  if (!post) {
    return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
  }

  await Posts.update(
    { hits: ++post.hits },
    {
      where: {
        id: postId,
      },
    }
  );

  return res.status(200).json({ data: '조회수가 반영되었습니다.' });
});

/**
 * name : 게시글 삭제
 * description : 삭제 처리
 * writer : Jay Choi
 * date : 2023.03.07
 */
router.delete('/posts/:postId', authMiddleware, async (req, res) => {
  const { postId } = req.params;
  const { id: userId } = res.locals.user;

  // 게시글을 조회합니다.
  const post = await Posts.findOne({ where: { id: postId } });

  if (!post) {
    return res.status(404).json({ message: '게시글이 존재하지 않습니다.' });
  } else if (post.writerId !== userId) {
    return res.status(401).json({ message: '권한이 없습니다.' });
  }

  // 게시글의 권한을 확인하고, 게시글을 삭제합니다.
  await Posts.destroy({
    where: {
      [Op.and]: [{ id: postId }, { writerId: userId }],
    },
  });

  return res.status(200).json({ data: '게시글이 삭제되었습니다.' });
});

module.exports = router;
