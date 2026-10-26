class SavingsAccount extends BankAccount {
    private final Long interestRate;

    SavingsAccount(String name, Long interestRate) {
        super(name);
        this.interestRate = interestRate;
    }
    @Override 
    Boolean canDebit(Long debit){
        if(debit<=500){
            return false;
        }
        return true;
    }
};