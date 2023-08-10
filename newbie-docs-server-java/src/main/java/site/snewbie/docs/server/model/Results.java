package site.snewbie.docs.server.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import site.snewbie.docs.server.enums.ResultsStatusEnum;

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
        return Results.build(ResultsStatusEnum.SUCCESS);
    }

    public static <R> Results<R> success(R result) {
        return Results.build(ResultsStatusEnum.SUCCESS, result);
    }

    public static <R> Results<R> failed(ResultsStatusEnum resultsStatus) {
        return Results.build(resultsStatus);
    }

    public static <R> Results<R> failed(ResultsException e) {
        return Results.build(e.getResultsStatus());
    }

    public static <R> Results<R> build(ResultsStatusEnum resultsStatus) {
        return new Results<>(resultsStatus.getCode(), resultsStatus.getMsg());
    }

    public static <R> Results<R> build(ResultsStatusEnum resultsStatus, R result) {
        return new Results<>(resultsStatus.getCode(), resultsStatus.getMsg(), result);
    }
}
