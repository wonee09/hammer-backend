const express = require('express');
const jwt = require('jsonwebtoken');
// const { Users, UserInfos, UserHistories, sequelize } = require('../models');
const { Users } = require('../models');
const { sequelize } = require('../models');
const { Transaction } = require('sequelize');
const router = express.Router();
const SECRET_KEY = 'TEST_SECRET_KEY';
// const authMiddleware = require('../middlewares/auth-middleware');

let tokenObject = {}; // Refresh Token을 저장할 Object(key : refreshToken / value : userId)

// 회원가입
router.post('/users', async (req, res) => {
  const { email, password, nickName } = req.body;
  const isExistUser = await Users.findOne({ where: { email } });

  if (isExistUser) {
    return res.status(409).json({ message: '이미 존재하는 이메일입니다.' });
  }

  // MYSQL과 연결된 sequelize connection에서 transaction을 생성
  const t = await sequelize.transaction({
    isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED, // 트랜잭션 격리수준 설정(높은 수준의 일관성을 요구하지 않는 경우 Read Commited)
  });
  try {
    // Users 테이블에 사용자를 추가합니다.
    // const user = await Users.create({ email, password }, { transaction: t });
    await Users.create({ email, password, nickName }, { transaction: t });

    // UserInfos 테이블에 사용자 정보를 추가합니다.
    // const userInfo = await UserInfos.create(
    //   {
    //     UserId: user.id, // 생성한 유저의 id를 바탕으로 사용자 정보를 생성합니다.
    //     email,
    //     nickName,
    //     age,
    //     gender: gender.toUpperCase(), // 성별을 대문자로 변환합니다.
    //     profileImage,
    //   },
    //   { transaction: t }
    // );

    // 트랜잭션을 사용한 모든 로직을 Commit, DB에 반영
    await t.commit();
  } catch (transactionError) {
    //에러가 발생하면, 트랜잭션을 사용한 모든 쿼리 Rollback, DB에 반영하지 않음
    console.log(transactionError);
    await t.rollback;
    return res.status(400).json({ errorMessage: '유저 생성에 실패했습니다.' });
  }

  return res.status(201).json({ message: '회원가입이 완료되었습니다.' });
});

// 이메일 인증일자 갱신
router.patch('/users/:id', async (req, res) => {
  const { id } = req.params;
  const user = await Users.findOne({ where: { id } });
  if (!user) {
    return res.status(401).json({ message: '존재하지 않는 이메일입니다.' });
  }

  const t = await sequelize.transaction({
    isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED,
  });
  try {
    await Users.update(
      { emailVerificationDate: new Date() },
      {
        where: { id: user.id },
        transaction: t,
      }
    );
    await t.commit();

    //     await UserInfos.update(
    //       { name },
    //       {
    //         where: { userId },
    //         transaction: t, // transaction을 사용
    //       }
    //     );
  } catch (transactionError) {
    console.log(transactionError);
    await t.rollback;
    return res
      .status(400)
      .json({ errorMessage: '이메일 인증에 실패하였습니다.' });
  }

  return res.status(200).json({ message: '이메일 인증에 성공하였습니다.' });
});

// 로그인
// output : access, refresh 모두 반환
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await Users.findOne({ where: { email } });
  if (!user) {
    return res.status(401).json({ message: '존재하지 않는 이메일입니다.' });
  } else if (user.password !== password) {
    return res.status(401).json({ message: '비밀번호가 일치하지 않습니다.' });
  }

  // 일단은 ct, rt 오두 cookie에 저장하여 반환
  // 이후 보안 정책에 맞게 변경할 것
  const accessToken = createAccessToken(user.id);
  const refreshToken = createRefreshToken();

  // refresh token으로 해당 유저의 정보를 서버에 저장
  tokenObject[refreshToken] = user.id;

  // res.cookie('accessToken', `Bearer ${accessToken}`);
  res.cookie('accessToken', accessToken);
  res.cookie('refreshToken', refreshToken);
  return res.status(200).json({ message: '로그인 성공' });
});

// 유효성 검증(프론트엔드에서 라우팅 시 토큰의 유효성 검증 시 사용)
// 입력 : access token과 refresh token
router.get('/verify-token', (req, res) => {
  // console.log('클라이언트의 request.cookies => ', req.cookies);
  // console.log('클라이언트의 request.params => ', req.params);
  // console.log('클라이언트의 request.body => ', req.body);
  // console.log('클라이언트의 request.headers => ', req.headers);

  const accessToken = req.headers.accesstoken;
  const refreshToken = req.headers.refreshtoken;

  if (!refreshToken)
    return res
      .status(400)
      .json({ message: 'Refresh Token이 존재하지 않습니다.' });
  if (!accessToken)
    return res
      .status(400)
      .json({ message: 'Access Token이 존재하지 않습니다.' });

  const isAccessTokenValidate = validateAccessToken(accessToken);
  const isRefreshTokenValidate = validateRefreshToken(refreshToken);

  // refresh token의 검증이 실패한 경우
  if (!isRefreshTokenValidate)
    return res.status(419).json({ message: 'Refresh Token이 만료되었습니다.' });

  // access token의 검증이 실패한 경우
  if (!isAccessTokenValidate) {
    const accessTokenId = tokenObject[refreshToken]; // refresh token을 발급받을 당시, user의 id(accessTokenId)로 tokenObject를 구성했음
    if (!accessTokenId)
      return res
        .status(419)
        .json({ message: 'Refresh Token의 정보가 서버에 존재하지 않습니다.' });

    // 새로운 access token 발급(access token은 만료되었으나, refresh token 검증은 성공했고 tokenObject(서버)에도 userId에 해당하는 정보가 존재하면)
    const newAccessToken = createAccessToken(accessTokenId);
    res.cookie('accessToken', newAccessToken);
    return res
      .status(200)
      .json({ message: 'Access Token이 새롭게 발급되었습니다.' });
  }

  // 성공적으로 수행된 경우
  const { id } = getAccessTokenPayload(accessToken);

  return res.status(201).json({
    message: `${id}의 Payload를 가진 Token이 성공적으로 인증되었습니다.`,
  });
});

// 사용자 조회
router.get('/users/:userId', async (req, res) => {
  const { userId } = req.params;

  const user = await Users.findOne({
    attributes: ['userId', 'email', 'createdAt', 'updatedAt'],
    include: [
      {
        model: UserInfos, // 1:1 관계를 맺고있는 UserInfos 테이블을 조회합니다.
        attributes: ['name', 'age', 'gender', 'profileImage'],
      },
    ],
    where: { userId },
  });

  return res.status(200).json({ data: user });
});

// 사용자 이름 변경
// auth 검증이 필요한 api 요청인 경우 authMiddleware를 거친다.
// router.put('/users/name', authMiddleware, async (req, res) => {
//   const userId = 1;
//   const { name } = req.body;

//   const userInfo = await UserInfos.findOne({ where: { userId } });
//   const beforeUserName = userInfo.name;

//   // MySQL과 연결된 sequelize connection에서 transaction을 생성합니다.
//   const t = await sequelize.transaction({
//     isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED, // 트랜잭션 격리 레벨 설정
//   });
//   try {
//     await UserInfos.update(
//       { name },
//       {
//         where: { userId },
//         transaction: t, // transaction을 사용
//       }
//     );

//     await UserHistories.create(
//       {
//         UserId: userId,
//         beforeUserName: beforeUserName,
//         afterName: name,
//       },
//       { transaction: t } // transaction을 사용
//     );

//     t.commit();
//   } catch (transactionError) {
//     console.error(transactionError);
//     t.rollback();
//     return res
//       .status(400)
//       .json({ errorMessage: '유저 이름 변경에 실패하였습니다.' });
//   }

//   return res.status(200).json({
//     message: '유저 이름 변경에 성공하였습니다.',
//   });
// });

module.exports = router;

/** functions */
// generate access token
function createAccessToken(id) {
  console.log('id => ', id);
  const accessToken = jwt.sign(
    { id }, // JWT 데이터
    SECRET_KEY, // 비밀 키
    { expiresIn: '600s' } // Access Token이 10초 뒤에 만료
  );

  return accessToken;
}

// generate refresh token
function createRefreshToken() {
  const refreshToken = jwt.sign(
    {}, // JWT 데이터
    SECRET_KEY, // 비밀 키
    { expiresIn: '7d' } // Refresh Token이 7일 뒤에 만료
  );

  return refreshToken;
}

// verify access token
function validateAccessToken(accessToken) {
  try {
    jwt.verify(accessToken, SECRET_KEY); // JWT 검증
    return true;
  } catch (error) {
    return false;
  }
}

// verify refresh token
function validateRefreshToken(refreshToken) {
  try {
    jwt.verify(refreshToken, SECRET_KEY); //JWT 검증
    return true;
  } catch (error) {
    return false;
  }
}

// get payloads of access token
function getAccessTokenPayload(accessToken) {
  try {
    const payload = jwt.verify(accessToken, SECRET_KEY); // JWT에서 payload를 get
    console.log('payload => ', payload);
    return payload;
  } catch (error) {
    return null;
  }
}
