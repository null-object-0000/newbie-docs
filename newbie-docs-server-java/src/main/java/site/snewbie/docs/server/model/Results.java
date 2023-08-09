package site.snewbie.docs.server.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Results<R> {
    private String code;
    private String msg;
    private R result;

    public Results(String code, String msg) {
        this.code = code;
        this.msg = msg;
    }

    public static <R> Results<R> success() {
        return new Results<>("0000", "success");
    }

    public static <R> Results<R> success(R result) {
        return new Results<>("0000", "success", result);
    }

    public static <R> Results<R> failed(String code, String msg) {
        return new Results<>(code, msg);
    }
}
