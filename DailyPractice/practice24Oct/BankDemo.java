class BankDemo {
    public static void main() {
        BankAccount samyakAccount = new BankAccount("Samyak",1000L);
        System.out.println(samyakAccount);

        BankAccount raviAccount = new BankAccount("Samyak", 1000L);
        System.out.println(raviAccount);
        // System.out.println(samyakAccount.equals(raviAccount));
        deposit(samyakAccount, 500);
        withdraw(raviAccount, 2000);
        deposit(samyakAccount, -50);
        withdraw(raviAccount, 300);

        System.out.println(samyakAccount);
        System.out.println(raviAccount);
        System.out.println("Accounts opened: " + BankAccount.getTotalAccount());
    }

    static void deposit(BankAccount account, long amount) {
        try {
            boolean done = account.addCredit(amount);
            System.out.println("deposit " + amount + " into " + account.getAccountNumber() + ": " + done);
        } catch (IllegalArgumentException e) {
            System.out.println(
                    "deposit " + amount + " into " + account.getAccountNumber() + " rejected (" + e.getMessage() + ")");
        }

    }

    static void withdraw(BankAccount account, long amount) {

        try {
            boolean done = account.addDebit(amount);
            System.out.println("withdraw " + amount + " from " + account.getAccountNumber() + ": " + done);
        } catch (IllegalArgumentException e) {
            System.out.println(
                    "withdraw " + amount + " into " + account.getAccountNumber() + " rejected (" + e.getMessage() + ")");
        }
    }
}
