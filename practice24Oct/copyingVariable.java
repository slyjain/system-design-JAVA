import java.lang.reflect.Array;
import java.util.Scanner;
import java.util.stream.Gatherer.Integrator;

int x;
int getLength(int x){
    x=1080;
    return 1;
}
int getLength(int []z){
    int sz=z.length;
    if(sz>0){
        z[0]=101010;
    }
    return sz;

}
void main(){
    int y=x;
    x=5;
    System.out.println("x = "+x+", y = "+y);
    int []arr={0,0,1,3,2,5};
    int []brr=Arrays.copyOf(arr,arr.length);
    brr[0]=5;
    System.out.println(Arrays.toString(arr));
    System.out.println(Arrays.toString(brr));
    getLength(y);
    getLength(brr);
    System.out.println(y);
    System.out.println(Arrays.toString(brr));
    Scanner sc=new Scanner(System.in);
    String s=sc.next();
    String t=sc.next();
    System.out.println(s==t);
    System.out.println(s.equals(t));
    int lt127=127;
    int lt127_2=127;
    int gt127=128;
    int gt127_2=128;
    System.out.println(lt127==lt127_2);
    System.out.println(gt127==gt127_2);
    Integer lt127_3=lt127;
    Integer lt127_4=lt127;
    Integer gt127_3=gt127,gt127_4=gt127;
    System.out.println(lt127_3==lt127_4);
    System.out.println(gt127_3==gt127_4);
}