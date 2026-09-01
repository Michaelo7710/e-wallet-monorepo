import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import UserTab from './UserTab';
import TransferScreen from '@features/payment/screens/TransferScreen';
import TopUpScreen from '@features/payment/screens/TopUpScreen';
import WithdrawScreen from '@features/payment/screens/WithdrawScreen';
import SetupPinScreen from '@features/user/screens/SetupPinScreen';
import ChangePinScreen from '@features/user/screens/ChangePinScreen';
import ChangePasswordScreen from '@features/user/screens/ChangePasswordScreen';
import ChangeEmailScreen from '@features/user/screens/ChangeEmailScreen';
import KycVerificationScreen from '@features/user/screens/KycVerificationScreen';
import SnapPaymentWebViewScreen from '@features/payment/screens/SnapPaymentWebViewScreen';

export type UserStackParamList = {
  MainTab: undefined;
  Transfer: undefined;
  TopUp: undefined;
  Withdraw: undefined;
  SetupPin: undefined;
  ChangePin: undefined;
  ChangePassword: undefined;
  ChangeEmail: undefined;
  KycVerification: undefined;
  SnapPaymentWebView: { redirectUrl: string; referenceId?: string; amount?: number };
};

const Stack = createNativeStackNavigator<UserStackParamList>();

const UserStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTab" component={UserTab} />
      <Stack.Screen name="Transfer" component={TransferScreen} />
      <Stack.Screen name="TopUp" component={TopUpScreen} />
      <Stack.Screen name="Withdraw" component={WithdrawScreen} />
      <Stack.Screen name="SetupPin" component={SetupPinScreen} />
      <Stack.Screen name="ChangePin" component={ChangePinScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <Stack.Screen name="ChangeEmail" component={ChangeEmailScreen} />
      <Stack.Screen name="KycVerification" component={KycVerificationScreen} />
      <Stack.Screen name="SnapPaymentWebView" component={SnapPaymentWebViewScreen} />
    </Stack.Navigator>
  );
};

export default UserStack;