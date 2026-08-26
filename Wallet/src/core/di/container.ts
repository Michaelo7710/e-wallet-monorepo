import { AuthRemoteDataSource } from '@data/datasources/remote/auth.remote-datasource';
import { PaymentRemoteDataSource } from '@data/datasources/remote/payment.remote-datasource';
import { UserRemoteDataSource } from '@data/datasources/remote/user.remote-datasource';

import { AuthRepositoryImpl } from '@data/repositories/auth.repository.impl';
import { PaymentRepositoryImpl } from '@data/repositories/payment.repository.impl';
import { UserRepositoryImpl } from '@data/repositories/user.repository.impl';

// DataSources
const authRemoteDataSource = new AuthRemoteDataSource();
const paymentRemoteDataSource = new PaymentRemoteDataSource();
const userRemoteDataSource = new UserRemoteDataSource();

// Repositories
export const authRepository = new AuthRepositoryImpl(authRemoteDataSource);
export const paymentRepository = new PaymentRepositoryImpl(paymentRemoteDataSource);
export const userRepository = new UserRepositoryImpl(userRemoteDataSource);