import { config } from 'dotenv';
config();


if (!process.env.username) {
  console.error('username wasn\t defined');
  process.exit(1);
}
if (!process.env.password) {
  console.error('password wasn\'t defined');
  process.exit(1);
}
if (!process.env.secret) {
  console.error('secret wasn\'t defined');
  process.exit(1);
}

export default {
    username: process.env.username!,
    password: process.env.password!,
    secret: process.env.secret!,
    upload: process.env.upload || 'uploads',
    PORT: +(process.env.PORT || 3000)
};
