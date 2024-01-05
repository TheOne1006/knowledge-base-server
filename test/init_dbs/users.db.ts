import {
  ROLE_AUTHENTICATED,
  ROLE_SUPER_ADMIN,
} from '../../src/common/constants';

const initUsers = [
  {
    id: 1,
    username: 'John',
    email: '2ddd@xxx.com',
    salt: '1233',
    password: 'xxxxx',
    roles: [ROLE_AUTHENTICATED, ROLE_SUPER_ADMIN],
  },
  {
    id: 2,
    username: 'Melody',
    email: '2ddd3@xxx.com',
    salt: '1197cf83',
    password: '253a0e8b6d5e32d2c38a1a96f2a5b86c', // 123456
    roles: [ROLE_AUTHENTICATED, ROLE_SUPER_ADMIN],
  },
  {
    id: 3,
    username: 'Tom',
    email: 'ddaass@xxx.com',
    salt: '1233',
    password: 'xxxxx',
    roles: [ROLE_AUTHENTICATED, ROLE_SUPER_ADMIN],
  },
  {
    id: 5,
    username: 'delete trans',
    email: 'deltetrans@xxx.com',
    salt: '1233',
    password: 'xxxxx',
    roles: [ROLE_AUTHENTICATED, ROLE_SUPER_ADMIN],
  },
];

export default [...initUsers];
