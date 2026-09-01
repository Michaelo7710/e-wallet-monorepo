// import React from 'react';
// import { createNativeStackNavigator } from '@react-navigation/native-stack';
// import LoginScreen from '@features/auth/screens/LoginScreen';
// import RegisterScreen from '@features/auth/screens/RegisterScreen';

// const Stack = createNativeStackNavigator();

// const AuthStack = () => {
//   return (
//     <Stack.Navigator screenOptions={{ headerShown: false }}>
//       <Stack.Screen name="Login" component={LoginScreen} />
//       <Stack.Screen name="Register" component={RegisterScreen} />
//     </Stack.Navigator>
//   );
// };

// export default AuthStack;

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { User } from '@domain/entities/user';
import { AuthTokens } from '@domain/repositories/auth.repository.interface';
import LoginScreen from '@features/auth/screens/LoginScreen';
import RegisterScreen from '@features/auth/screens/RegisterScreen';
import VerifyEmailScreen from '@features/auth/screens/VerifyEmailScreen';
import ForgotPasswordScreen from '@features/auth/screens/ForgotPasswordScreen';
import ResetPasswordScreen from '@features/auth/screens/ResetPasswordScreen';
import TwoFactorAuthScreen from '@features/auth/screens/TwoFactorAuthScreen';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  VerifyEmail: { email?: string };
  ForgotPassword: undefined;
  ResetPassword: { email?: string };
  TwoFactorAuth: { user: User; tokens: AuthTokens };
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

const AuthStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <Stack.Screen name="TwoFactorAuth" component={TwoFactorAuthScreen} />
    </Stack.Navigator>
  );
};

export default AuthStack;