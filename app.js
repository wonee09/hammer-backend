const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const usersRouter = require('./routes/users.route');
const postsRouter = require('./routes/posts.route');
const addressRouter = require('./routes/address.route');
const commentRouter = require('./routes/comments.route');
const likesRouter = require('./routes/likes.route');
const app = express();
const PORT = 3018;
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: 'http://localhost:3000',
    credentials: true,
  })
);
app.use('/api', [
  usersRouter,
  postsRouter,
  addressRouter,
  commentRouter,
  likesRouter,
]);

app.listen(PORT, () => {
  console.log(PORT, '포트 번호로 서버가 실행되었습니다.');
});
1;
