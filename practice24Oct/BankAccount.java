import java.util.Set;

class BankAccount{
    private static Long count=1L;
    private final Long accountNumber;
    private final String name;
    private Long balance;
    Set<Long> accountSet;
    public BankAccount(String name){
        this.name=name;
        this.accountNumber=count;
        this.balance=0L;
        count++;

    }
    public BankAccount (String name,Long balance){
        this.name=name;
        if(balance<0){
            throw new IllegalArgumentException("The balance only stays greater than or equal to zero");
        }
        this.balance=balance;
        this.accountNumber=count;
        count++;
    }
     public String getName(){
        return name;
    }
    Long getAccountNumber(){
        return this.accountNumber;
    }
    public static Long getTotalAccount(){
        return count;
    }
    void setBalance(Long newBalance){
        if(newBalance<0){
            return;
        }
        this.balance=newBalance;
    }
    Boolean addCredit(Long credit){
        if(credit<0){
            return false;
        }
        this.balance+=credit;
        return true;
    }
    Boolean canDebit(Long debit){
        if(debit<0){
            return false;
        }
        return balance>=debit;
    }
    Boolean addDebit(Long debit){
        if(canDebit(debit)){
            balance-=debit;
            return true;
        }
        return false;
    }

    @Override 
    public String toString(){
        return "Account "+accountNumber+ "(" + name + ") : balance " +balance;
    }
};