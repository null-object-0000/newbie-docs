package site.snewbie.docs.server;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan("site.snewbie.docs.server.dao")
public class NewbieDocsServerJavaApplication {

	public static void main(String[] args) {
		SpringApplication.run(NewbieDocsServerJavaApplication.class, args);
	}

}
