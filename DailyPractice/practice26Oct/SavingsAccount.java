class SavingsAccount extends BankAccount {
    private final Long interestRate;

    SavingsAccount(String name, Long interestRate) {
        if (interestRate < 0) {
            throw new IllegalArgumentException("Interest rate cannnot be negative");
        }
        super(name);

        this.interestRate = interestRate;
    }

    SavingsAccount(String name, Long balance, Long interestRate) {
        if (interestRate < 0) {
            throw new IllegalArgumentException("Interest rate cannnot be negative");
        }
        super(name, balance);
        this.interestRate = interestRate;
    }

    @Override
    Boolean canDebit(Long debit) {
        if (this.getBalance() - debit < 500) {
            return false;
        }
        return true;
    }

    public void addInterest() {
        Long currentBalance = this.getBalance();
        if(currentBalance==0L || interestRate==0L){
            return;
        }

        addCredit(currentBalance * interestRate / 100L);
    }

    @Override
    public String toString() {
        return "Savings " + this.getAccountNumber() + " (" + this.getName() + "): balance " + this.getBalance()
            + ", interest " + interestRate + "%";
    }
};