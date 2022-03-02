// setting timeout for the test to run with database connection timing
jest.setTimeout(10000);

import {
  Connection, createConnection, getRepository, Repository,
} from 'typeorm';

import { User } from '../modules/users/entities/User';
// import { Statement } from '../modules/statements/entities/Statement';

import { UsersRepository } from '../modules/users/repositories/UsersRepository';
// import { StatementsRepository } from '../modules/statements/repositories/StatementsRepository';


describe('Repositories', () => {
  // setup public test variables
  let connection: Connection;

  let ormUsersRepository: Repository<User>;

  let usersRepository: UsersRepository;

  let seededUsers: User[];

  beforeAll(async () => {
    // stablish connections and setup tables
    connection = await createConnection();

    ormUsersRepository = getRepository(User);

    usersRepository = new UsersRepository();

    await connection.query('DROP TABLE IF EXISTS users_statements_statements');
    await connection.query('DROP TABLE IF EXISTS users');
    await connection.query('DROP TABLE IF EXISTS statements');
    await connection.query('DROP TABLE IF EXISTS migrations');

    await connection.runMigrations();


    // seed users
    const usersToSeed = ormUsersRepository.create([
      {
        name: 'Cammy figher',
        email: 'cammy@gmail.com',
        password: '123456',
      },
      {
        name: 'Ken figher',
        email: 'ken@gmail.com',
        password: '123456',
      },
      {
        name: 'Sakura figher',
        email: 'sakura@gmail.com',
        password: '123456',
      },
      {
        name: 'Ryu figher',
        email: 'ryu@gmail.com',
        password: '123456',
      },
    ]);

    seededUsers = await ormUsersRepository.save(usersToSeed);
    if (!seededUsers) {
      throw new Error('User not seeded');
    }

  });

  afterAll(async () => {
    await connection.close();
  });

  it("[UsersRepository] should be able to create user by passing name, email and password", async () => {
    const createdUser = await usersRepository.create({
      name: "Carlos",
      email: "carloscarlos@gmail.com",
      password: "123456",
    });

    expect(createdUser).toMatchObject({
      name: 'Carlos',
      email: 'carloscarlos@gmail.com',
      password: '123456'
    });
  });

  it('[UsersRepository] should be able to find user by ID(uuid)', async () => {
    const userIdToFind = seededUsers[0].id;
    if (!userIdToFind) {
      throw new Error('User ID not found in seeded users');
    }

    const foundUser = await usersRepository.findById(userIdToFind);

    expect(foundUser).toBeTruthy();
    expect(foundUser).toMatchObject({
      name: seededUsers[0].name,
    });
  });

  it('[UsersRepository] should be able to find user by email', async () => {
    const userEmailToFind = seededUsers[0].email;
    if (!userEmailToFind) {
      throw new Error('User email not found in seeded users');
    }

    const foundUser = await usersRepository.findByEmail(userEmailToFind);

    expect(foundUser).toBeTruthy();
    expect(foundUser).toMatchObject({
      name: seededUsers[0].name,
    });
  });
});
