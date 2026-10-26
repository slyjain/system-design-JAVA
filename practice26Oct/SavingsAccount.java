class SavingsAccount extends BankAccount {
    private final Long interestRate;

    SavingsAccount(String name, Long interestRate) {
        super(name);
        this.interestRate = interestRate;
    }

    SavingsAccount(String name, Long balance, Long interestRate) {
        super(name, balance);
        this.interestRate = interestRate;
    }

    @Override
    Boolean canDebit(Long debit) {
        if (debit <= 500) {
            return false;
        }
        return true;
    }
    void addInterest(){
        Long currentBalance=this.getBalance();
        addCredit(currentBalance*interestRate/100L);
    }
};