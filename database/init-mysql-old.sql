CREATE DATABASE barbak;
USE barbak;

-- Tools

CREATE TABLE tool_types (
    `type_id` INT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    PRIMARY KEY (`type_id`)
);

INSERT INTO tool_types (`name`) VALUES 
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


CREATE TABLE tool_materials (
    `material_id` INT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    PRIMARY KEY (`material_id`)
);

INSERT INTO tool_materials (`name`) VALUES 
    ('stainless steel'),
    ('brass'),
    ('wood'),
    ('plastic'),
    ('aluminum'),
    ('silicone'),
    ('glass'),
    ('ceramic'),
    ('titanium'),
    ('graphite'),
    ('other')
;


-- Ingredients

CREATE TABLE ingredient_types (
    `type_id` INT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    PRIMARY KEY (`type_id`)
);

CREATE TABLE ingredient_categories (
    `category_id` INT NOT NULL AUTO_INCREMENT,
    `type_id` INT NOT NULL,
    `name` VARCHAR(50) NOT NULL,
    `measure_state` VARCHAR(50) NOT NULL,
    PRIMARY KEY (`category_id`),
    FOREIGN KEY (`type_id`) REFERENCES ingredient_types (`type_id`)
);

INSERT INTO ingredient_types (`name`) VALUES 
    ('liquor'),
    ('liqueur'),
    ('beer'),
    ('wine'),
    ('mixer'),
    ('enhancer'),
    ('fruit'),
    ('other')
;

INSERT INTO ingredient_categories (`type_id`, `name`, `measure_state`) VALUES 
    ((SELECT type_id FROM ingredient_types WHERE name = 'liquor'), 'whisky', 'volume'),
    ((SELECT type_id FROM ingredient_types WHERE name = 'liquor'), 'gin', 'volume'),
    ((SELECT type_id FROM ingredient_types WHERE name = 'liquor'), 'vodka', 'volume'),
    ((SELECT type_id FROM ingredient_types WHERE name = 'liquor'), 'rum', 'volume'),
    ((SELECT type_id FROM ingredient_types WHERE name = 'liquor'), 'tequila', 'volume'),
    ((SELECT type_id FROM ingredient_types WHERE name = 'liquor'), 'brandy', 'volume'),

    ((SELECT type_id FROM ingredient_types WHERE name = 'liqueur'), 'orange', 'volume'),
    ((SELECT type_id FROM ingredient_types WHERE name = 'liqueur'), 'coffee', 'volume'),
    ((SELECT type_id FROM ingredient_types WHERE name = 'liqueur'), 'cream', 'volume'),
    ((SELECT type_id FROM ingredient_types WHERE name = 'liqueur'), 'nut', 'volume'),
    ((SELECT type_id FROM ingredient_types WHERE name = 'liqueur'), 'herb', 'volume'),
    ((SELECT type_id FROM ingredient_types WHERE name = 'liqueur'), 'fruit', 'volume'),

    ((SELECT type_id FROM ingredient_types WHERE name = 'beer'), 'lager', 'volume'),
    ((SELECT type_id FROM ingredient_types WHERE name = 'beer'), 'ale', 'volume'),
    ((SELECT type_id FROM ingredient_types WHERE name = 'beer'), 'wheat', 'volume'),
    ((SELECT type_id FROM ingredient_types WHERE name = 'beer'), 'stout', 'volume'),
    ((SELECT type_id FROM ingredient_types WHERE name = 'beer'), 'porter', 'volume'),
    ((SELECT type_id FROM ingredient_types WHERE name = 'beer'), 'sour', 'volume'),
    ((SELECT type_id FROM ingredient_types WHERE name = 'beer'), 'belgia', 'volume'),

    ((SELECT type_id FROM ingredient_types WHERE name = 'wine'), 'red', 'volume'),
    ((SELECT type_id FROM ingredient_types WHERE name = 'wine'), 'white', 'volume'),
    ((SELECT type_id FROM ingredient_types WHERE name = 'wine'), 'rosé', 'volume'),
    ((SELECT type_id FROM ingredient_types WHERE name = 'wine'), 'sparkling', 'volume'),
    ((SELECT type_id FROM ingredient_types WHERE name = 'wine'), 'fortified', 'volume'),

    ((SELECT type_id FROM ingredient_types WHERE name = 'mixer'), 'juice', 'volume'),
    ((SELECT type_id FROM ingredient_types WHERE name = 'mixer'), 'syrup', 'volume'),
    ((SELECT type_id FROM ingredient_types WHERE name = 'mixer'), 'soda', 'volume'),
    ((SELECT type_id FROM ingredient_types WHERE name = 'mixer'), 'dairy', 'volume'),
    ((SELECT type_id FROM ingredient_types WHERE name = 'mixer'), 'tea', 'volume'),
    ((SELECT type_id FROM ingredient_types WHERE name = 'mixer'), 'coffee', 'volume'),

    ((SELECT type_id FROM ingredient_types WHERE name = 'enhancer'), 'spice', 'mass'),
    ((SELECT type_id FROM ingredient_types WHERE name = 'enhancer'), 'herb', 'quantity'),
    ((SELECT type_id FROM ingredient_types WHERE name = 'enhancer'), 'salt', 'mass'),
    ((SELECT type_id FROM ingredient_types WHERE name = 'enhancer'), 'bitter', 'volume'),

    ((SELECT type_id FROM ingredient_types WHERE name = 'fruit'), 'citrus', 'volume'),
    ((SELECT type_id FROM ingredient_types WHERE name = 'fruit'), 'berry', 'volume'),
    ((SELECT type_id FROM ingredient_types WHERE name = 'fruit'), 'melon', 'volume'),
    ((SELECT type_id FROM ingredient_types WHERE name = 'fruit'), 'tropical', 'volume'),
    ((SELECT type_id FROM ingredient_types WHERE name = 'fruit'), 'stone', 'volume'),
    ((SELECT type_id FROM ingredient_types WHERE name = 'fruit'), 'pome', 'volume')

    -- *** Insert for other ***
;
-- Drinkware

CREATE TABLE drinkware_materials (
    `material_id` INT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    PRIMARY KEY (`material_id`)
);

INSERT INTO drinkware_materials (`name`) VALUES 
    ('crystal'),
    ('wood'),
    ('glass'),
    ('stainless steel'),
    ('ceramic'),
    ('copper'),
    ('bamboo'),
    ('silicone'),
    ('acrylic'),
    ('paper'),
    ('plastic'),
    ('other')
;

-- Drink

CREATE TABLE drink_preparation_methods (
    `method_id` INT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    PRIMARY KEY (`method_id`)
);

INSERT INTO drink_preparation_methods (`name`) VALUES 
    ('stir'),
    ('shake'),
    ('blend'),
    ('build'),
    ('muddle'),
    ('layer'),
    ('flame'),
    ('churn'),
    ('carbonate'),
    ('infuse'),
    ('smoke'),
    ('spherify'),
    ('swizzle'),
    ('roll'),
    ('other')
;


CREATE TABLE drink_serving_styles (
    `style_id` INT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    PRIMARY KEY (`style_id`)
);

INSERT INTO drink_serving_styles (`name`) VALUES 
    ('neat'),
    ('straight-up'),
    ('on the rocks'),
    ('straight'),
    ('chilled'),
    ('other')
;


-- Measure

CREATE TABLE measure (
    `measure_id` INT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    `abbriviation` VARCHAR(10),
    `is_standarized` BOOLEAN NOT NULL,
    `measure_use` VARCHAR(50) NOT NULL,
    `ounce_equivalence` FLOAT,
    PRIMARY KEY(`measure_id`)
);

INSERT INTO measure (`name`, `abbriviation`, `is_standarized`, `measure_use`, `ounce_equivalence`) VALUES 
    ('ounce', 'oz', true, 'mass', 1),
    ('fluid ounce', 'fl oz', true, 'volume', 1),
    ('milliliter', 'ml', true, 'volume', 29.5735),
    ('teaspoon', 'tsp', true, 'volume', 6),
    ('tablespoon', 'tbsp', true, 'volume', 2),
    ('pint', 'pt', true, 'volume', 0.0625),
    ('liter', 'L', true, 'volume', 0.0295735),
    ('dash', NULL, false, 'volume', NULL),
    ('centiliter', 'cl', true, 'volume', 2.95735),
    ('cup', 'c', true, 'volume', 0.125),
    ('quart', 'qt', true, 'volume', 0.03125),
    ('drop', NULL, false, 'volume', NULL),
    ('gram', 'gm', true, 'mass', 28.3495),
    ('milligram', 'mg', true, 'mass', 28349.5),
    ('pound', 'lb', true, 'mass', 0.0625),
    ('splash', NULL, false, 'volume', NULL),
    ('part', NULL, false, 'miscellaneous', NULL),
    ('half', NULL, false, 'miscellaneous', NULL),
    ('leaf', NULL, false, 'quantity', NULL),
    ('peel' ,NULL, false, 'quantity', NULL),
    ('quarter', NULL, false, 'miscellaneous', NULL),
    ('shaving', NULL, false, 'quantity', NULL),
    ('slice', NULL, false, 'quantity', NULL),
    ('third', NULL, false, 'miscellane ous',NULL),
    ('twist', NULL, false, 'quantity', NULL),
    ('wedge', NULL, false, 'quantity', NULL),
    ('cube', NULL, false, 'quantity', NULL),
    ('pinch', NULL, false, 'quantity', NULL),
    ('scoop', NULL, false, 'quantity', NULL),
    ('sprig', NULL, false, 'quantity', NULL),
    ('stalk', NULL, false, 'quantity', NULL)
;