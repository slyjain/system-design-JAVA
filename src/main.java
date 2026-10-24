import java.io.PrintStream;
import java.util.Scanner;

void main() {
    PrintStream os = System.out;
    os.println("Hello world");
    Scanner sc = new Scanner(System.in);
    Integer x=sc.nextInt();
    os.println(x);
    String name = sc.nextLine();
    os.println("Hello " + name);
}
// Java has a built-in class called System. It provides access to standard
// input, standard output, and standard error.