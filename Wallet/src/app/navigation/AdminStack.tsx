import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AdminDashboardScreen from '@features/admin/screens/AdminDashboardScreen';
import AdminWithdrawalApprovalScreen from '@features/admin/screens/AdminWithdrawalApprovalScreen';
import AdminTopUpApprovalScreen from '@features/admin/screens/AdminTopUpApprovalScreen';
import AdminTransferApprovalScreen from '@features/admin/screens/AdminTransferApprovalScreen';
import AdminBankManagementScreen from '@features/admin/screens/AdminBankManagementScreen';
import AdminFinancialReportScreen from '@features/admin/screens/AdminFinancialReportScreen';

const Stack = createNativeStackNavigator();

const AdminStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
      <Stack.Screen name="AdminApprovals" component={AdminWithdrawalApprovalScreen} />
      <Stack.Screen name="AdminTopUpApprovals" component={AdminTopUpApprovalScreen} />
      <Stack.Screen name="AdminTransferApprovals" component={AdminTransferApprovalScreen} />
      <Stack.Screen name="AdminBankManagement" component={AdminBankManagementScreen} />
      <Stack.Screen name="AdminFinancialReport" component={AdminFinancialReportScreen} />
    </Stack.Navigator>
  );
};

export default AdminStack;