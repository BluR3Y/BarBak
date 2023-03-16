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


-- Materials

CREATE TABLE barware_material_categories (
    `id` INT(6) NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    PRIMARY KEY (`id`)
);

INSERT INTO barware_material_categories (`name`) VALUES
    ('glassware'),
    ('ceramicware'),
    ('metalware'),
    ('plasticware'),
    ('woodenware'),
    ('other')
;

CREATE TABLE barware_materials (
    `id` INT(6) NOT NULL AUTO_INCREMENT,
    `category_id` INT(6) NOT NULL,
    `name` VARCHAR(50) NOT NULL,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`category_id`) REFERENCES barware_material_categories (`id`)
);

INSERT INTO barware_materials (`category_id`, `name`) VALUES
    ((SELECT id FROM barware_material_categories WHERE name = 'glassware'), 'glass'),
    ((SELECT id FROM barware_material_categories WHERE name = 'glassware'), 'crystal'),
    ((SELECT id FROM barware_material_categories WHERE name = 'glassware'), 'soda lime'),
    ((SELECT id FROM barware_material_categories WHERE name = 'glassware'), 'borosilicate'),
    ((SELECT id FROM barware_material_categories WHERE name = 'glassware'), 'tempered'),

    ((SELECT id FROM barware_material_categories WHERE name = 'ceramicware'), 'ceramic'),
    ((SELECT id FROM barware_material_categories WHERE name = 'ceramicware'), 'clay'),
    ((SELECT id FROM barware_material_categories WHERE name = 'ceramicware'), 'porcelain'),
    ((SELECT id FROM barware_material_categories WHERE name = 'ceramicware'), 'earthenware'),
    ((SELECT id FROM barware_material_categories WHERE name = 'ceramicware'), 'stoneware'),

    ((SELECT id FROM barware_material_categories WHERE name = 'metalware'), 'metal'),
    ((SELECT id FROM barware_material_categories WHERE name = 'metalware'), 'stainless steel'),
    ((SELECT id FROM barware_material_categories WHERE name = 'metalware'), 'brass'),
    ((SELECT id FROM barware_material_categories WHERE name = 'metalware'), 'aluminum'),
    ((SELECT id FROM barware_material_categories WHERE name = 'metalware'), 'titanium'),
    ((SELECT id FROM barware_material_categories WHERE name = 'metalware'), 'copper'),
    ((SELECT id FROM barware_material_categories WHERE name = 'metalware'), 'pewter'),
    ((SELECT id FROM barware_material_categories WHERE name = 'metalware'), 'silver'),
    ((SELECT id FROM barware_material_categories WHERE name = 'metalware'), 'gold'),
    ((SELECT id FROM barware_material_categories WHERE name = 'metalware'), 'cast iron'),
    ((SELECT id FROM barware_material_categories WHERE name = 'metalware'), 'enamelware'),

    ((SELECT id FROM barware_material_categories WHERE name = 'plasticware'), 'plastic'),
    ((SELECT id FROM barware_material_categories WHERE name = 'plasticware'), 'Polycarbonate'),
    ((SELECT id FROM barware_material_categories WHERE name = 'plasticware'), 'acrylic'),
    ((SELECT id FROM barware_material_categories WHERE name = 'plasticware'), 'tritan'),
    ((SELECT id FROM barware_material_categories WHERE name = 'plasticware'), 'polypropylene'),
    ((SELECT id FROM barware_material_categories WHERE name = 'plasticware'), 'melamine'),

    ((SELECT id FROM barware_material_categories WHERE name = 'woodenware'), 'wood'),
    ((SELECT id FROM barware_material_categories WHERE name = 'woodenware'), 'oak'),
    ((SELECT id FROM barware_material_categories WHERE name = 'woodenware'), 'maple'),
    ((SELECT id FROM barware_material_categories WHERE name = 'woodenware'), 'cherry'),
    ((SELECT id FROM barware_material_categories WHERE name = 'woodenware'), 'teak'),
    ((SELECT id FROM barware_material_categories WHERE name = 'woodenware'), 'olive'),
    ((SELECT id FROM barware_material_categories WHERE name = 'woodenware'), 'pine'),
    ((SELECT id FROM barware_material_categories WHERE name = 'woodenware'), 'walnut'),

    ((SELECT id FROM barware_material_categories WHERE name = 'other'), 'graphite'),
    ((SELECT id FROM barware_material_categories WHERE name = 'other'), 'silicone'),
    ((SELECT id FROM barware_material_categories WHERE name = 'other'), 'bamboo'),
    ((SELECT id FROM barware_material_categories WHERE name = 'other'), 'paper'),
    ((SELECT id FROM barware_material_categories WHERE name = 'other'), 'rubber')
;

-- Ingredients

CREATE TABLE ingredient_categories (
    `id` INT(6) NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    PRIMARY KEY (`id`)
);

CREATE TABLE ingredient_sub_categories (
    `id` INT(6) NOT NULL AUTO_INCREMENT,
    `category_id` INT NOT NULL,
    `name` VARCHAR(50) NOT NULL,
    `measure_state` VARCHAR(50) NOT NULL,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`category_id`) REFERENCES ingredient_categories (`id`)
);

INSERT INTO ingredient_categories (`name`) VALUES 
    ('liquor'),
    ('liqueur'),
    ('beer'),
    ('wine'),
    ('mixer'),
    ('enhancer'),
    ('fruit'),
    ('other')
;

INSERT INTO ingredient_sub_categories (`category_id`, `name`, `measure_state`) VALUES 
    ((SELECT id FROM ingredient_categories WHERE name = 'liquor'), 'whisky', 'volume'),
    ((SELECT id FROM ingredient_categories WHERE name = 'liquor'), 'gin', 'volume'),
    ((SELECT id FROM ingredient_categories WHERE name = 'liquor'), 'vodka', 'volume'),
    ((SELECT id FROM ingredient_categories WHERE name = 'liquor'), 'rum', 'volume'),
    ((SELECT id FROM ingredient_categories WHERE name = 'liquor'), 'tequila', 'volume'),
    ((SELECT id FROM ingredient_categories WHERE name = 'liquor'), 'brandy', 'volume'),

    ((SELECT id FROM ingredient_categories WHERE name = 'liqueur'), 'orange', 'volume'),
    ((SELECT id FROM ingredient_categories WHERE name = 'liqueur'), 'coffee', 'volume'),
    ((SELECT id FROM ingredient_categories WHERE name = 'liqueur'), 'cream', 'volume'),
    ((SELECT id FROM ingredient_categories WHERE name = 'liqueur'), 'nut', 'volume'),
    ((SELECT id FROM ingredient_categories WHERE name = 'liqueur'), 'herb', 'volume'),
    ((SELECT id FROM ingredient_categories WHERE name = 'liqueur'), 'fruit', 'volume'),

    ((SELECT id FROM ingredient_categories WHERE name = 'beer'), 'lager', 'volume'),
    ((SELECT id FROM ingredient_categories WHERE name = 'beer'), 'ale', 'volume'),
    ((SELECT id FROM ingredient_categories WHERE name = 'beer'), 'wheat', 'volume'),
    ((SELECT id FROM ingredient_categories WHERE name = 'beer'), 'stout', 'volume'),
    ((SELECT id FROM ingredient_categories WHERE name = 'beer'), 'porter', 'volume'),
    ((SELECT id FROM ingredient_categories WHERE name = 'beer'), 'sour', 'volume'),
    ((SELECT id FROM ingredient_categories WHERE name = 'beer'), 'belgia', 'volume'),

    ((SELECT id FROM ingredient_categories WHERE name = 'wine'), 'red', 'volume'),
    ((SELECT id FROM ingredient_categories WHERE name = 'wine'), 'white', 'volume'),
    ((SELECT id FROM ingredient_categories WHERE name = 'wine'), 'rosé', 'volume'),
    ((SELECT id FROM ingredient_categories WHERE name = 'wine'), 'sparkling', 'volume'),
    ((SELECT id FROM ingredient_categories WHERE name = 'wine'), 'fortified', 'volume'),

    ((SELECT id FROM ingredient_categories WHERE name = 'mixer'), 'juice', 'volume'),
    ((SELECT id FROM ingredient_categories WHERE name = 'mixer'), 'syrup', 'volume'),
    ((SELECT id FROM ingredient_categories WHERE name = 'mixer'), 'soda', 'volume'),
    ((SELECT id FROM ingredient_categories WHERE name = 'mixer'), 'dairy', 'volume'),
    ((SELECT id FROM ingredient_categories WHERE name = 'mixer'), 'tea', 'volume'),
    ((SELECT id FROM ingredient_categories WHERE name = 'mixer'), 'coffee', 'volume'),

    ((SELECT id FROM ingredient_categories WHERE name = 'enhancer'), 'spice', 'mass'),
    ((SELECT id FROM ingredient_categories WHERE name = 'enhancer'), 'herb', 'quantity'),
    ((SELECT id FROM ingredient_categories WHERE name = 'enhancer'), 'salt', 'mass'),
    ((SELECT id FROM ingredient_categories WHERE name = 'enhancer'), 'bitter', 'volume'),

    ((SELECT id FROM ingredient_categories WHERE name = 'fruit'), 'citrus', 'volume'),
    ((SELECT id FROM ingredient_categories WHERE name = 'fruit'), 'berry', 'volume'),
    ((SELECT id FROM ingredient_categories WHERE name = 'fruit'), 'melon', 'volume'),
    ((SELECT id FROM ingredient_categories WHERE name = 'fruit'), 'tropical', 'volume'),
    ((SELECT id FROM ingredient_categories WHERE name = 'fruit'), 'stone', 'volume'),
    ((SELECT id FROM ingredient_categories WHERE name = 'fruit'), 'pome', 'volume')

    -- *** Insert for other ***
;

-- Drink

CREATE TABLE drink_preparation_methods (
    `id` INT(6) NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    PRIMARY KEY (`id`)
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
    `id` INT(6) NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    PRIMARY KEY (`id`)
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