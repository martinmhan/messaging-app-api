DROP PROCEDURE IF EXISTS create_initial_tables;

DELIMITER $$

CREATE PROCEDURE create_initial_tables()
BEGIN
  DECLARE user_table_count INT;
  DECLARE conversation_table_count INT;
  DECLARE conversation_user_table_count INT;
  DECLARE message_table_count INT;

  SET user_table_count = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_NAME = 'user'
  );

  SET conversation_table_count = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_NAME = 'conversation'
  );

  SET conversation_user_table_count = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_NAME = 'conversation_user'
  );

  SET message_table_count = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_NAME = 'message'
  );

  IF user_table_count = 0 THEN
    CREATE TABLE user (
      id INT NOT NULL AUTO_INCREMENT,
      created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      modified_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      user_name BLOB UNIQUE,
      password BLOB,
      first_name BLOB,
      last_name BLOB,
      PRIMARY KEY(id)
    );
  END IF;

  IF conversation_table_count = 0 THEN
    CREATE TABLE conversation (
      id INT NOT NULL AUTO_INCREMENT,
      created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      name BLOB,
      PRIMARY KEY(id)
    );
  END IF;

  IF conversation_user_table_count = 0 THEN
    CREATE TABLE conversation_user (
      id INT NOT NULL AUTO_INCREMENT,
      created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      conversation_id INT NOT NULL,
      user_id INT NOT NULL,
      PRIMARY KEY (id),
      FOREIGN KEY (conversation_id) REFERENCES conversation(id),
      FOREIGN KEY (user_id) REFERENCES user(id),
    );
  END IF;

  IF message_table_count = 0 THEN
    CREATE TABLE message (
      id INT NOT NULL AUTO_INCREMENT,
      created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      conversation_id INT NOT NULL,
      user_id INT NOT NULL,
      message BLOB NOT NULL,
      is_deleted BOOLEAN DEFAULT FALSE,
      PRIMARY KEY (id),
      FOREIGN KEY (conversation_id) REFERENCES conversation(id),
      FOREIGN KEY (user_id) REFERENCES user(id)
    );
  END IF;
END $$

DELIMITER ;

CALL create_initial_tables();
DROP PROCEDURE IF EXISTS create_initial_tables;