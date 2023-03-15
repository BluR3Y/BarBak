CREATE DATABASE barbak;
USE barbak;

-- Tools

CREATE TABLE tool_categories (
    `id` INT(6) NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    PRIMARY KEY (`id`)
);

INSERT INTO tool_categories (`name`) VALUES
    ('mixing'),
    ('measuring'),
    ('stirring'),
    ('muddling'),
    ('straining'),
    ('opening'),
    ('serving'),
    ('pouring'),
    ('garnishing'),
    ('cutting'),
    ('chilling'),
    ('cleaning'),
    ('other')
;

-- Drinkware

CREATE TABLE drinkware_categories (
    `id` INT(6) NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    PRIMARY KEY (`id`)
);

