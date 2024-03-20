CREATE TABLE guess (
  word varchar(255) NOT NULL,
  color varchar(7) DEFAULT NULL,
  amount int DEFAULT 0,
  UNIQUE KEY (word, color),
  INDEX (word)
);
