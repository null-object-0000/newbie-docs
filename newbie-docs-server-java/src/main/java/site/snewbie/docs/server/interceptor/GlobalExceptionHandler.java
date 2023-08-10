package site.snewbie.docs.server.interceptor;

import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import site.snewbie.docs.server.model.Results;
import site.snewbie.docs.server.model.ResultsException;

@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(ResultsException.class)
    public Results<Void> handleResultsException(ResultsException e) {
        return Results.failed(e);
    }
}
