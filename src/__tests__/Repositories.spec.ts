// setting timeout for the test to run with database connection timing
jest.setTimeout(10000);

import {
  Connection, createConnection, getRepository, Repository,
} from 'typeorm';

import { User } from '../modules/users/entities/User';
import { Statement } from '../modules/statements/entities/Statement';

import { UsersRepository } from '../modules/users/repositories/UsersRepository';
import { StatementsRepository } from '../modules/statements/repositories/StatementsRepository';


describe('Repositories', () => {
  // setup public test variables
  let connection: Connection;

  let ormUsersRepository: Repository<User>;
  let ormStatementsRepository: Repository<Statement>;

  let usersRepository: UsersRepository;
  let statementsRepository: StatementsRepository;

  let seededUsers: User[];
  let seededStatements: Statement[];

  enum OperationType {
    DEPOSIT = 'deposit',
    WITHDRAW = 'withdraw',
  }

  beforeAll(async () => {
    // stablish connections and setup tables
    connection = await createConnection();

    ormUsersRepository = getRepository(User);
    ormStatementsRepository = getRepository(Statement);

    usersRepository = new UsersRepository();
    statementsRepository = new StatementsRepository();

    await connection.query('DROP TABLE IF EXISTS users_statements_statements cascade');
    await connection.query('DROP TABLE IF EXISTS users cascade');
    await connection.query('DROP TABLE IF EXISTS statements cascade');
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

    // seed statements
    const statementsToSeed = ormStatementsRepository.create([
      {
        user_id: seededUsers[1].id,
        amount: 100,
        description: 'deposit',
        type: OperationType.DEPOSIT,
      },
      {
        user_id: seededUsers[1].id,
        amount: 20,
        description: 'withdraw',
        type: OperationType.WITHDRAW,
      },
    ]);

    seededStatements = await ormStatementsRepository.save(statementsToSeed);

  });

  afterAll(async () => {

    await connection.query('DROP TABLE IF EXISTS users_statements_statements cascade');
    await connection.query('DROP TABLE IF EXISTS users cascade');
    await connection.query('DROP TABLE IF EXISTS statements cascade');
    await connection.query('DROP TABLE IF EXISTS migrations');

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

  it('[StatementsRepository] should be able to create statement by passing user_id, amount, description and type', async () => {
    const userId = seededUsers[0].id;
    if (!userId) {
      throw new Error('User id not found in seeded users');
    }

    const createdStatement = await statementsRepository.create({
      user_id: userId,
      amount: 500,
      description: 'Statement description',
      type: OperationType.DEPOSIT,
    });


    expect(createdStatement).toBeTruthy();
    expect(createdStatement).toMatchObject({
      user_id: seededUsers[0].id,
      amount: 500,
      description: 'Statement description',
      type: OperationType.DEPOSIT,
    });
  });

  it('[StatementsRepository] should be able to find statement operation by passing id and user_id', async () => {
    const statementIdToFind = seededStatements[0].id;
    const statementUserIdToFind = seededStatements[0].user_id;
    if (!statementIdToFind) {
      throw new Error('Statement id not found in seeded statements');
    }

    const foundStatement = await statementsRepository.findStatementOperation({
      statement_id: statementIdToFind,
      user_id: statementUserIdToFind,
    });

    expect(foundStatement).toBeTruthy();
    expect(foundStatement).toMatchObject({
      id: statementIdToFind,
    });
  });

  it('[StatementsRepository] should be able to get user balance by passing user_id and optional statement boolean', async () => {
    const userId = seededUsers[1].id;
    if (!userId) {
      throw new Error('User id not found in seeded users');
    }

    const userBalance = await statementsRepository.getUserBalance({
      user_id: userId,
    });
    const userBalance2 = await statementsRepository.getUserBalance({
      user_id: userId,
      with_statement: true,
    });

    expect(userBalance).toBeTruthy();
    expect(userBalance2).toBeTruthy();
    expect(userBalance).toMatchObject({
      balance: 80,
    });
    expect(userBalance).not.toHaveProperty('statement');
    expect(userBalance2).toMatchObject({
      balance: 80,
    });
    expect(userBalance2).toHaveProperty("statement")
  });
});

