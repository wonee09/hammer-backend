const jwt = require('jsonwebtoken');
const { Users } = require('../models');

// api call을 할 때 access token이 없고 refresh token만 있으면 어떻게 하지?

// refresh token이 없는 경우 토큰 없다고 해야하고

module.exports = async (req, res, next) => {
  try {
    const { accessToken, refreshToken } = req.cookies;
    // const [tokenType, token] = authorization.split(' ');
    // if (tokenType !== 'Bearer') {
    //   return res
    //     .status(401)
    //     .json({ message: '토큰 타입이 일치하지 않습니다.' });
    // }

    const decodedToken = jwt.verify(accessToken, 'TEST_SECRET_KEY');
    console.log('decodedToken', decodedToken);
    const id = decodedToken.id;

    const user = await Users.findOne({ where: { id } });
    if (!user) {
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');
      return res
        .status(401)
        .json({ message: '토큰 사용자가 존재하지 않습니다.' });
    }

    // console.log('토큰 사용자가 존재해요!');
    res.locals.user = user;

    // console.log('user 정보 => ', user);

    next();
  } catch (error) {
    res.clearCookie('authorization');
    return res.status(401).json({
      message: '비정상적인 요청입니다.',
    });
  }
};
