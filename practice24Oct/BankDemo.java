class BankDemo {
    public static void main() {
        BankAccount samyakAccount = new BankAccount("Samyak", 1001L);
        System.out.println(samyakAccount);

        BankAccount raviAccount = new BankAccount("Ravi", 1000L, 1002L);
        System.out.println(raviAccount);

        deposit(samyakAccount, 500);
        withdraw(raviAccount, 2000);
        deposit(samyakAccount, -50);
        withdraw(raviAccount, 300);

        System.out.println(samyakAccount);
        System.out.println(raviAccount);
        System.out.println("Accounts opened: " + BankAccount.getTotalAccount());
    }

    static void deposit(BankAccount account, long amount) {
        boolean done = account.addCredit(amount);
        System.out.println("deposit " + amount + " into " + account.getAccountNumber() + ": " + done);
    }

    static void withdraw(BankAccount account, long amount) {
        boolean done = account.addDebit(amount);
        System.out.println("withdraw " + amount + " from " + account.getAccountNumber() + ": " + done);
    }
}
