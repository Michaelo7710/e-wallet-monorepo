const AdminBank = require("./AdminBank");
const User = require("./User");
const SavedContact = require("./SavedContact");
const Wallet = require("./Wallet");
const VerificationCode = require("./VerificationCode");
const TopUpRequest = require("./TopUpRequest");
const Transaction = require("./Transaction");
const WithdrawalRequest = require("./WithdrawalRequest");
const RefreshToken = require("./RefreshToken");



module.exports={
    User, VerificationCode, Wallet, AdminBank, SavedContact, TopUpRequest, Transaction, WithdrawalRequest, RefreshToken
}