class BankAccount{
    private static Long count=0L;
    private final Long accountNumber;
    private final static Long FIRST_ACCOUNT_NUMBER=1000L;
    private final String name;
    private Long balance;
    public BankAccount(String name){
        this.name=name;
        count++;
        this.accountNumber=FIRST_ACCOUNT_NUMBER+count;
        this.balance=0L;
        

    }
    public BankAccount (String name,Long balance){
        this.name=name;
        if(balance<0){
            throw new IllegalArgumentException("Opening balance cant be negative : "+balance);
        }
        this.balance=balance;
        count++;
        this.accountNumber=FIRST_ACCOUNT_NUMBER+count;
        
    }
     public String getName(){
        return name;
    }
    Long getAccountNumber(){
        return this.accountNumber;
    }
    Long getBalance(){
        return balance;
    }
    public static Long getTotalAccount(){
        return count;
    }
    Boolean addCredit(Long credit) throws IllegalArgumentException{
        if(credit<=0){
            throw new IllegalArgumentException("The value credited should be positive");
            // return false;
        }
        this.balance+=credit;
        return true;
    }
    Boolean canDebit(Long debit){
        if(debit<=0){
            // throw new IllegalArgumentException("The value debited should be positive");
            return false;
        }
        return balance>=debit;
    }
    Boolean addDebit(Long debit){
        if(debit<=0){
            throw new IllegalArgumentException("The amount to be debited cannot be negative");
        }
        if(canDebit(debit)){
            balance-=debit;
            return true;
        }
        return false;
    }

    @Override 
    public String toString(){
        return "Account "+accountNumber+ " (" + name + "): balance " +balance;
    }
};