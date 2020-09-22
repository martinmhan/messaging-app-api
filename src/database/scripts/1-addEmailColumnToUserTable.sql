DROP PROCEDURE IF EXISTS addEmailColumnToUserTable;

DELIMITER $$

CREATE PROCEDURE addEmailColumnToUserTable()
BEGIN
  DECLARE emailColumnCount INT;

  SET emailColumnCount = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
		  TABLE_SCHEMA = DATABASE() AND
      TABLE_NAME = 'user' AND
      COLUMN_NAME = 'email'
  );

  IF emailColumnCount = 0 THEN
    ALTER TABLE user ADD COLUMN email BLOB UNIQUE DEFAULT NULL;
  END IF;
END $$

DELIMITER ;

CALL addEmailColumnToUserTable();
DROP PROCEDURE IF EXISTS addEmailColumnToUserTable;