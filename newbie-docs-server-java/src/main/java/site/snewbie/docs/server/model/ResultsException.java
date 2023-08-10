package site.snewbie.docs.server.model;

import lombok.Getter;
import site.snewbie.docs.server.enums.ResultsStatusEnum;

@Getter
public class ResultsException extends RuntimeException {
    private final ResultsStatusEnum resultsStatus;

    public ResultsException(ResultsStatusEnum resultsStatus) {
        super(resultsStatus.getMsg());
        this.resultsStatus = resultsStatus;
    }

    public ResultsException(ResultsStatusEnum resultsStatus, String msg) {
        super(msg);
        this.resultsStatus = resultsStatus;
    }

    public String getCode() {
        return resultsStatus.getCode();
    }
}
