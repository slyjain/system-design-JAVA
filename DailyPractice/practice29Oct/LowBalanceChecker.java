public class LowBalanceChecker {
    private final Notifier notifier;

    LowBalanceChecker(Notifier notifier) {
        this.notifier = notifier;
    }

    public void check(BankAccount account) {
        if (account.getBalance() < 0) {
            notifier.send("Account " + account.getAccountNumber() + " is below zero:" + account.getBalance());
        }

    }
}
