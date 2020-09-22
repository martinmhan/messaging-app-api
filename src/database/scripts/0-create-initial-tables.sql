DROP PROCEDURE IF EXISTS createInitialTables;

DELIMITER $$

CREATE PROCEDURE createInitialTables()
BEGIN
  DECLARE userTableCount INT;
  DECLARE conversationTableCount INT;
  DECLARE conversationUserTableCount INT;
  DECLARE messageTableCount INT;

  SET userTableCount = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.TABLES
    WHERE
		  TABLE_SCHEMA = DATABASE() AND
      TABLE_NAME = 'user'
  );

  SET conversationTableCount = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.TABLES
    WHERE
		  TABLE_SCHEMA = DATABASE() AND
      TABLE_NAME = 'conversation'
  );

  SET conversationUserTableCount = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.TABLES
    WHERE
		  TABLE_SCHEMA = DATABASE() AND
      TABLE_NAME = 'conversationUser'
  );

  SET messageTableCount = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.TABLES
    WHERE
		  TABLE_SCHEMA = DATABASE() AND
		  TABLE_NAME = 'message'
  );

  IF userTableCount = 0 THEN
    CREATE TABLE user (
      id INT NOT NULL AUTO_INCREMENT,
      createdDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      modifiedDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      userName VARCHAR(255) UNIQUE,
      password BLOB,
      firstName BLOB,
      lastName BLOB,
      isDeleted BOOLEAN DEFAULT FALSE,
      PRIMARY KEY(id)
    );
  END IF;

  IF conversationTableCount = 0 THEN
    CREATE TABLE conversation (
      id INT NOT NULL AUTO_INCREMENT,
      createdDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      name BLOB,
      isDeleted BOOLEAN DEFAULT FALSE,
      PRIMARY KEY(id)
    );
  END IF;

  IF conversationUserTableCount = 0 THEN
    CREATE TABLE conversationUser (
      id INT NOT NULL AUTO_INCREMENT,
      createdDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      conversationId INT NOT NULL,
      userId INT NOT NULL,
      isDeleted BOOLEAN DEFAULT FALSE,
      PRIMARY KEY (id),
      FOREIGN KEY (conversationId) REFERENCES conversation(id),
      FOREIGN KEY (userId) REFERENCES user(id)
    );
  END IF;

  IF messageTableCount = 0 THEN
    CREATE TABLE message (
      id INT NOT NULL AUTO_INCREMENT,
      createdDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      conversationId INT NOT NULL,
      userId INT NOT NULL,
      text BLOB NOT NULL,
      isDeleted BOOLEAN DEFAULT FALSE,
      PRIMARY KEY (id),
      FOREIGN KEY (conversationId) REFERENCES conversation(id),
      FOREIGN KEY (userId) REFERENCES user(id)
    );
  END IF;
END $$

DELIMITER ;

CALL createInitialTables();
DROP PROCEDURE IF EXISTS createInitialTables;