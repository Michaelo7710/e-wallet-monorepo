import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AdminDashboardScreen from '@features/admin/screens/AdminDashboardScreen';
import AdminWithdrawalApprovalScreen from '@features/admin/screens/AdminWithdrawalApprovalScreen';

const Stack = createNativeStackNavigator();

const AdminStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
      <Stack.Screen name="AdminApprovals" component={AdminWithdrawalApprovalScreen} />
    </Stack.Navigator>
  );
};

export default AdminStack;