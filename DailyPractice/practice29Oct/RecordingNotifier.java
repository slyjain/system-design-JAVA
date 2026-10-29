import java.util.ArrayList;
import java.util.List;

public class RecordingNotifier implements Notifier {
    private List<String> allMessages = new ArrayList<>();

    public void send(String message) {
        allMessages.add(message);
    }

    public List<String> getAllMessages() {
        return allMessages;
    }
}
