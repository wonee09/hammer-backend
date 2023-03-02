const express = require('express');
const cookieParser = require('cookie-parser');
const usersRouter = require('./routes/users.route');
const postsRouter = require('./routes/posts.route');
const cors = require('cors');
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
app.use('/api', [usersRouter, postsRouter]);

app.listen(PORT, () => {
  console.log(PORT, '포트 번호로 서버가 실행되었습니다.');
});
1;