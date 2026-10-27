public class CurrentAccount extends BankAccount {
    private final Long overDraftLimit;

    CurrentAccount(String name, Long overDraftLimit) {
        if (overDraftLimit < 0) {
            throw new IllegalArgumentException("Overdraft limit cannot be negative");
        }
        super(name);
        this.overDraftLimit = overDraftLimit;
    }

    CurrentAccount(String name, Long balance, Long overDraftLimit) {
        if (overDraftLimit < 0) {
            throw new IllegalArgumentException("Overdraft limit cannot be negative");
        }
        super(name, balance);
        this.overDraftLimit = overDraftLimit;
    }

    @Override
    Boolean canDebit(Long debit) {
        if (debit <= 0) {
            return false;
        }
        return debit <= this.getBalance() + overDraftLimit;
    }

    @Override
    public String toString() {
        return super.toString() + ", overdraft " + this.overDraftLimit;
    }
};
