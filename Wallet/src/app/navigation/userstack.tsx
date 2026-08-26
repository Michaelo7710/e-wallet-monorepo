import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import UserTab from './UserTab';
import TransferScreen from '@features/payment/screens/TransferScreen';
import TopUpScreen from '@features/payment/screens/TopUpScreen';
import WithdrawScreen from '@features/payment/screens/WithdrawScreen';

const Stack = createNativeStackNavigator();

const UserStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTab" component={UserTab} />
      <Stack.Screen name="Transfer" component={TransferScreen} />
      <Stack.Screen name="TopUp" component={TopUpScreen} />
      <Stack.Screen name="Withdraw" component={WithdrawScreen} />
    </Stack.Navigator>
  );
};

export default UserStack;