public interface Notifier {
    public void send(String message);
    default String describe(){
        return "Notifier";
    }
}
