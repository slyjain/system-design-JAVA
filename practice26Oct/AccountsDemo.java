import java.util.ArrayList;
import java.util.List;

class AccountDemo{
    public static void main(String[] args) {
        List<BankAccount> currAccounts=new ArrayList<BankAccount>();
        currAccounts.add(new SavingsAccount("Samyak", 10000L,10L));
        currAccounts.add(new CurrentAccount("Samyak", 1000L,1000L));
        
    }
}