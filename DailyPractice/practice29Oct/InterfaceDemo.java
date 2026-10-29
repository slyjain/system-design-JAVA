import java.util.ArrayList;
import java.util.List;

public class InterfaceDemo {
    public static void main(String[] args) {
        SavingsAccount acc1 = new SavingsAccount("Samyak", 1000L, 4L);
        CurrentAccount acc2 = new CurrentAccount("Ravi", 1000L, 2000L);
        InterestBearing acc3 = new FixedDeposit("Meera", 5000L, 7L);
        acc2.addDebit(2600L);
        List<InterestBearing> interestBearers = new ArrayList<>();
        interestBearers.add(acc1);
        interestBearers.add(acc3);
        // InterestBearing.MAX_RATE=30L;
        LowBalanceChecker lowBalanceChecker = new LowBalanceChecker(new ConsoleNotifier());

        for (InterestBearing x : interestBearers) {
            x.addInterest();
            System.out.println(x.toString());
        }
        lowBalanceChecker.check(acc1);
        lowBalanceChecker.check(acc2);
        RecordingNotifier recordingNotifier = new RecordingNotifier();
        LowBalanceChecker recordingLowBalanceChecker = new LowBalanceChecker(recordingNotifier);
        recordingLowBalanceChecker.check((SavingsAccount) acc1);
        recordingLowBalanceChecker.check(acc2);
        System.out.println("recorded " + recordingNotifier.getAllMessages().size() + " message(s)");
        // Notifier n = new Notifier();
        Notifier shout = msg -> System.out.println(msg.toUpperCase());
        LowBalanceChecker lbc = new LowBalanceChecker(shout);
    }
}
