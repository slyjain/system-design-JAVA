import java.util.ArrayList;
import java.util.List;

class AccountDemo {
    public static void withdraw(BankAccount bankAccount, Long amount) {
        try {
            Boolean done = bankAccount.addDebit(amount);
            System.out.println("withdraw " + amount + " from " + bankAccount.getAccountNumber() + ": " + done);
        } catch (Exception e) {
            System.out.println("The withdral failed because" + e.getMessage());
        }
    }

    public static void main(String[] args) {
        // List<BankAccount> currAccounts = new ArrayList<BankAccount>();
        BankAccount[] accounts = new BankAccount[2];
        SavingsAccount a = new SavingsAccount("Samyak", 1000L, 4L);
        accounts[0]=a;
        accounts[1] = new CurrentAccount("Ravi", 1000L, 2000L);
        // currAccounts.add(new SavingsAccount("Samyak", 10000L, 4L));
        // currAccounts.add(new CurrentAccount("Ravi", 1000L, 2000L));
        withdraw(accounts[0],600L);
        withdraw(accounts[1], 600L);
        withdraw(accounts[1], 2000L);
        System.out.println(accounts[0].toString());
        System.out.println(accounts[1].toString());
        // accounts[0].addInterest();
        a.addInterest();
        withdraw(a, 600L);
        // BankAccount c=new BankAccount("Tanishka",1000L);
    }
}