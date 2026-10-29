public interface InterestBearing extends BankEntity {
    public static Long MAX_RATE = 20L;

    public void addInterest();
     default String describe(){
        return "InterestBearing";
    }
}
