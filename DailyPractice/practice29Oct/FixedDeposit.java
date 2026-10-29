public class FixedDeposit implements InterestBearing {
    private Long amount;
    private Long rateOfInterest;
    private final String accountHolder;

    FixedDeposit(String accountHolder, Long amount, Long rateOfInterest) {
        if (amount <= 0 || rateOfInterest < 0) {
            throw new IllegalArgumentException("Amount or rate of Interest for Fixed deposit cannot be negative");
        }
        this.accountHolder = accountHolder;
        this.amount = amount;
        this.rateOfInterest = rateOfInterest;
    }

    void addCredit(Long returns) {
        this.amount += returns;
    }

    public void addInterest() {
        Long currentBalance = this.amount;
        if (currentBalance == 0L || rateOfInterest == 0) {
            return;
        }

        addCredit(currentBalance * rateOfInterest / 100L);
    }
    @Override 
    public String toString(){
        return "FixedDeposit ("+accountHolder+"): amount "+amount+", interest "+rateOfInterest+"%";
    }
}
