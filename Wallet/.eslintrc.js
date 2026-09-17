module.exports = {
  root: true,
  extends: '@react-native',
  rules: {
    'no-restricted-imports': [
      'error',
      {
        paths: [
          {
            name: 'react-native',
            importNames: ['Alert'],
            message:
              'Dilarang mengimpor `Alert` dari react-native. Gunakan Unified Feedback System (`import { feedback } from "@core/feedback"`) sesuai standar arsitektur GreenPay.',
          },
        ],
      },
    ],
  },
};
