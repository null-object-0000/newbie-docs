package site.snewbie.docs.server.model;

import cn.hutool.core.util.StrUtil;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import site.snewbie.docs.server.enums.ResultsStatusEnum;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Results<R> {
    private String code;
    private String message;
    private R result;

    public Results(String code, String message) {
        this.code = code;
        this.message = message;
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
        if (StrUtil.isBlank(e.getMessage())){
            return Results.build(e.getResultsStatus());
        }else{
            return new Results<>(e.getCode(), e.getMessage());
        }
    }

    public static <R> Results<R> build(ResultsStatusEnum resultsStatus) {
        return new Results<>(resultsStatus.getCode(), resultsStatus.getMsg());
    }

    public static <R> Results<R> build(ResultsStatusEnum resultsStatus, R result) {
        return new Results<>(resultsStatus.getCode(), resultsStatus.getMsg(), result);
    }
}
