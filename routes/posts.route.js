const express = require('express');
const { Op } = require('sequelize');
const { Posts, Address, Comments } = require('../models');
const authMiddleware = require('../middlewares/auth-middleware');
const router = express.Router();

// 게시글 목록 조회
router.get('/posts', authMiddleware, async (req, res) => {
  console.log('TESTING ==> ', req.url);

  // query params를 두개로 나누기
  const partials = req.url.split('?')[1].split('&');

  // 각각의 parameter로 분리
  const idParam = partials[0].split('=')[1];
  const encodedSearchParam = partials[1].split('=')[1];

  const searchParam = decodeURIComponent(encodedSearchParam);

  console.log('id param => ', idParam);
  console.log('디코디드 => ', searchParam);

  const posts = await Posts.findAll({
    where: searchParam
      ? { addressId: idParam, title: { [Op.like]: `%${searchParam}%` } }
      : { addressId: idParam },
    order: [['createdAt', 'DESC']],
  });

  const response = posts.map((post) => {
    return { ...post.dataValues, writerName: res.locals.user.nickName };
  });

  return res.status(200).json({ data: response });
});

// 댓글 조회
router.get('/comments/:postId', authMiddleware, async (req, res) => {
  const { postId } = req.params;

  const post = await Posts.findOne({ whrer: { id: postId } });
  if (!post) {
    res.status(404).json({ message: '게시물이 존재하지 않습니다.' });
  }

  const comments = await Comments.findAll({ where: { postId } });
  console.log('댓글 결과물 ====> ', comments);

  return res.status(200).json({ data: comments });
});

// 주소정보 입력(주소검색 후, 선택할 때)
// 이미 존재하는 정보이면 id만 return, 존재하지 않는 정보이면 create 후 id return
router.post('/address', authMiddleware, async (req, res) => {
  console.log('주소 입력 server로 들어왔습니다.');

  // 위치정보 관련 정보
  const {
    zoneNo,
    totalRoadAddress,
    roadName,
    buildingName,
    mainBuildingNo,
    subBuildingNo,
    undergroundYn,
    xLoc,
    yLoc,
  } = req.body;

  // 입력하기 전, zoneNo와 totalRoadAddress가 일치하는 것이 있으면 pass, 없으면 새로 insert
  const registeredAddress = await Address.findOne({
    // attributes: ['id'],
    where: { zoneNo, totalRoadAddress },
  });

  console.log('등록된 주소 여부! => ', registeredAddress);

  if (registeredAddress) {
    console.log('이미 등록된 주소이므로, 등록된 주소 객체를 반환합니다.');
    return res.status(201).json({ data: registeredAddress });
  } else {
    // 입력 값
    //
    const address = await Address.create({
      zoneNo,
      totalRoadAddress,
      roadName,
      buildingName,
      mainBuildingNo,
      subBuildingNo,
      undergroundYn,
      xLoc,
      yLoc,
    });
    return res.status(201).json({ data: address });
  }
});

// 주소별 글 목록 조회
router.get('/posts/:addressId', authMiddleware, async (req, res) => {
  console.log('req', req.body);
  console.log('req', req.params);
  console.log('req', req.cookies);

  const { addressId, searchValue } = req.params;
  console.log('searchValue', searchValue);
  console.log('addressId', addressId);
  const posts = await Posts.findAll({
    where: { addressId },
    order: [['createdAt', 'DESC']],
  });

  // console.log('posts ==> ', posts);

  const response = posts.map((post) => {
    return { ...post.dataValues, writerName: res.locals.user.nickName };
  });

  return res.status(200).json({ data: response });
});

// 게시글 상세 조회
// router.get('/posts/:postId', async (req, res) => {
//   const { postId } = req.params;
//   const post = await Posts.findOne({
//     attributes: ['postId', 'title', 'content', 'createdAt', 'updatedAt'],
//     where: { postId },
//   });

//   return res.status(200).json({ data: post });
// });

// 게시글 생성
router.post('/posts', authMiddleware, async (req, res) => {
  console.log('111111111', res.locals.user);
  const userId = res.locals.user.id;

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

  return res.status(201).json({ data: post });
});

// 댓글 등록
router.post('/comment', authMiddleware, async (req, res) => {
  const userId = res.locals.user.id;

  const { postId, comment } = req.body;
  console.log('postId', postId);
  console.log('comment', comment);

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

// 게시글 수정
router.put('/posts/:postId', authMiddleware, async (req, res) => {
  const { postId } = req.params;
  const { userId } = res.locals.user;
  const { title, content } = req.body;

  // 게시글을 조회합니다.
  const post = await Posts.findOne({ where: { postId } });

  if (!post) {
    return res.status(404).json({ message: '게시글이 존재하지 않습니다.' });
  } else if (post.UserId !== userId) {
    return res.status(401).json({ message: '권한이 없습니다.' });
  }

  // 게시글의 권한을 확인하고, 게시글을 수정합니다.
  await Posts.update(
    { title, content }, // title과 content 컬럼을 수정합니다.
    {
      where: {
        [Op.and]: [{ postId }, { UserId: userId }],
      },
    }
  );

  return res.status(200).json({ data: '게시글이 수정되었습니다.' });
});

// 게시글 삭제
router.delete('/posts/:postId', authMiddleware, async (req, res) => {
  const { postId } = req.params;
  const { userId } = res.locals.user;

  // 게시글을 조회합니다.
  const post = await Posts.findOne({ where: { postId } });

  if (!post) {
    return res.status(404).json({ message: '게시글이 존재하지 않습니다.' });
  } else if (post.UserId !== userId) {
    return res.status(401).json({ message: '권한이 없습니다.' });
  }

  // 게시글의 권한을 확인하고, 게시글을 삭제합니다.
  await Posts.destroy({
    where: {
      [Op.and]: [{ postId }, { UserId: userId }],
    },
  });

  return res.status(200).json({ data: '게시글이 삭제되었습니다.' });
});

module.exports = router;
