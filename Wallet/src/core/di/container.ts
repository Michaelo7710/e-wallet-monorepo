import { AuthRemoteDataSource } from '@data/datasources/remote/auth.remote-datasource';
import { PaymentRemoteDataSource } from '@data/datasources/remote/payment.remote-datasource';
import { PaymentLocalDataSource } from '@data/datasources/local/payment.local-datasource';
import { UserRemoteDataSource } from '@data/datasources/remote/user.remote-datasource';
import { UserLocalDataSource } from '@data/datasources/local/user.local-datasource';
import { AdminRemoteDataSource } from '@data/datasources/remote/admin.remote-datasource';

import { AuthRepositoryImpl } from '@data/repositories/auth.repository.impl';
import { PaymentRepositoryImpl } from '@data/repositories/payment.repository.impl';
import { UserRepositoryImpl } from '@data/repositories/user.repository.impl';
import { AdminRepositoryImpl } from '@data/repositories/admin.repository.impl';

// Data Sources
const authRemoteDataSource = new AuthRemoteDataSource();
const paymentRemoteDataSource = new PaymentRemoteDataSource();
const paymentLocalDataSource = new PaymentLocalDataSource();
const userRemoteDataSource = new UserRemoteDataSource();
const userLocalDataSource = new UserLocalDataSource();
const adminRemoteDataSource = new AdminRemoteDataSource();

// Repositories
export const authRepository = new AuthRepositoryImpl(authRemoteDataSource);
export const paymentRepository = new PaymentRepositoryImpl(paymentRemoteDataSource, paymentLocalDataSource);
export const userRepository = new UserRepositoryImpl(userRemoteDataSource, userLocalDataSource);
export const adminRepository = new AdminRepositoryImpl(adminRemoteDataSource);

export { userLocalDataSource, paymentLocalDataSource };