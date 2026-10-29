public class ConsoleNotifier implements Notifier {
    private final String alertPrefix = "[ALERT]";

    public  void send(String message) {
        System.out.println(alertPrefix + message);
    }
}
