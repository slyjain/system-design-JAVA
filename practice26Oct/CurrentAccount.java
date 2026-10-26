public class CurrentAccount extends BankAccount {
    private final Long overDraftLimit;

    CurrentAccount(String name, Long overDraftLimit) {
        super(name);
        this.overDraftLimit = overDraftLimit;
    }

    CurrentAccount(String name, Long balance, Long overDraftLimit) {
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
};
