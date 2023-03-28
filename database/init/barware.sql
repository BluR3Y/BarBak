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

SELECT id INTO @glassware_material_id FROM barware_material_categories WHERE name = 'glassware';
SELECT id INTO @ceramicware_material_id FROM barware_material_categories WHERE name = 'ceramicware';
SELECT id INTO @metalware_material_id FROM barware_material_categories WHERE name = 'metalware';
SELECT id INTO @plasticware_material_id FROM barware_material_categories WHERE name = 'plasticware';
SELECT id INTO @woodenware_material_id FROM barware_material_categories WHERE name = 'woodenware';
SELECT id INTO @other_material_id FROM barware_material_categories WHERE name = 'other';

INSERT INTO barware_materials (`category_id`, `name`) VALUES
    (@glassware_material_id, 'glass'),
    (@glassware_material_id, 'crystal'),
    (@glassware_material_id, 'soda lime'),
    (@glassware_material_id, 'borosilicate'),
    (@glassware_material_id, 'tempered'),

    (@ceramicware_material_id, 'ceramic'),
    (@ceramicware_material_id, 'clay'),
    (@ceramicware_material_id, 'porcelain'),
    (@ceramicware_material_id, 'earthenware'),
    (@ceramicware_material_id, 'stoneware'),

    (@metalware_material_id, 'metal'),
    (@metalware_material_id, 'stainless steel'),
    (@metalware_material_id, 'brass'),
    (@metalware_material_id, 'aluminum'),
    (@metalware_material_id, 'titanium'),
    (@metalware_material_id, 'copper'),
    (@metalware_material_id, 'pewter'),
    (@metalware_material_id, 'silver'),
    (@metalware_material_id, 'gold'),
    (@metalware_material_id, 'cast iron'),
    (@metalware_material_id, 'enamelware'),

    (@plasticware_material_id, 'plastic'),
    (@plasticware_material_id, 'Polycarbonate'),
    (@plasticware_material_id, 'acrylic'),
    (@plasticware_material_id, 'tritan'),
    (@plasticware_material_id, 'polypropylene'),
    (@plasticware_material_id, 'melamine'),

    (@woodenware_material_id, 'wood'),
    (@woodenware_material_id, 'oak'),
    (@woodenware_material_id, 'maple'),
    (@woodenware_material_id, 'cherry'),
    (@woodenware_material_id, 'teak'),
    (@woodenware_material_id, 'olive'),
    (@woodenware_material_id, 'pine'),
    (@woodenware_material_id, 'walnut'),

    (@other_material_id, 'graphite'),
    (@other_material_id, 'silicone'),
    (@other_material_id, 'bamboo'),
    (@other_material_id, 'paper'),
    (@other_material_id, 'rubber')
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

SELECT id INTO @liquor_category_id FROM ingredient_categories WHERE name = 'liquor';
SELECT id INTO @liqueur_category_id FROM ingredient_categories WHERE name = 'liqueur';
SELECT id INTO @beer_category_id FROM ingredient_categories WHERE name = 'beer';
SELECT id INTO @wine_category_id FROM ingredient_categories WHERE name = 'wine';
SELECT id INTO @mixer_category_id FROM ingredient_categories WHERE name = 'mixer';
SELECT id INTO @enhancer_category_id FROM ingredient_categories WHERE name = 'enhancer';
SELECT id INTO @fruit_category_id FROM ingredient_categories WHERE name = 'fruit';
SELECT id INTO @other_category_id FROM ingredient_categories WHERE name = 'other';

INSERT INTO ingredient_sub_categories (`category_id`, `name`, `measure_state`) VALUES 
    (@liquor_category_id, 'whisky', 'volume'),
    (@liquor_category_id, 'gin', 'volume'),
    (@liquor_category_id, 'vodka', 'volume'),
    (@liquor_category_id, 'rum', 'volume'),
    (@liquor_category_id, 'tequila', 'volume'),
    (@liquor_category_id, 'brandy', 'volume'),

    (@liqueur_category_id, 'orange', 'volume'),
    (@liqueur_category_id, 'coffee', 'volume'),
    (@liqueur_category_id, 'cream', 'volume'),
    (@liqueur_category_id, 'nut', 'volume'),
    (@liqueur_category_id, 'herb', 'volume'),
    (@liqueur_category_id, 'fruit', 'volume'),

    (@beer_category_id, 'lager', 'volume'),
    (@beer_category_id, 'ale', 'volume'),
    (@beer_category_id, 'wheat', 'volume'),
    (@beer_category_id, 'stout', 'volume'),
    (@beer_category_id, 'porter', 'volume'),
    (@beer_category_id, 'sour', 'volume'),
    (@beer_category_id, 'belgia', 'volume'),

    (@wine_category_id, 'red', 'volume'),
    (@wine_category_id, 'white', 'volume'),
    (@wine_category_id, 'rosé', 'volume'),
    (@wine_category_id, 'sparkling', 'volume'),
    (@wine_category_id, 'fortified', 'volume'),

    (@mixer_category_id, 'juice', 'volume'),
    (@mixer_category_id, 'syrup', 'volume'),
    (@mixer_category_id, 'soda', 'volume'),
    (@mixer_category_id, 'dairy', 'volume'),
    (@mixer_category_id, 'tea', 'volume'),
    (@mixer_category_id, 'coffee', 'volume'),

    (@enhancer_category_id, 'spice', 'mass'),
    (@enhancer_category_id, 'herb', 'quantity'),
    (@enhancer_category_id, 'salt', 'mass'),
    (@enhancer_category_id, 'sugar', 'mass'),
    (@enhancer_category_id, 'bitter', 'volume'),

    (@fruit_category_id, 'citrus', 'volume'),
    (@fruit_category_id, 'berry', 'volume'),
    (@fruit_category_id, 'melon', 'volume'),
    (@fruit_category_id, 'tropical', 'volume'),
    (@fruit_category_id, 'stone', 'volume'),
    (@fruit_category_id, 'pome', 'volume'),

    (@other_category_id, 'n/a', 'all')
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
    `id` INT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    `abbriviation` VARCHAR(10),
    `is_standarized` TINYINT(1) NOT NULL,
    `measure_use` VARCHAR(50) NOT NULL,
    `ounce_equivalence` FLOAT,
    PRIMARY KEY(`id`)
);

INSERT INTO measure (`name`, `abbriviation`, `is_standarized`, `measure_use`, `ounce_equivalence`) VALUES 
    ('ounce', 'oz', 1, 'mass', 1),
    ('fluid ounce', 'fl oz', 1, 'volume', 1),
    ('milliliter', 'ml', 1, 'volume', 29.5735),
    ('teaspoon', 'tsp', 1, 'volume', 6),
    ('tablespoon', 'tbsp', 1, 'volume', 2),
    ('pint', 'pt', 1, 'volume', 0.0625),
    ('liter', 'L', 1, 'volume', 0.0295735),
    ('dash', NULL, 0, 'volume', NULL),
    ('centiliter', 'cl', 1, 'volume', 2.95735),
    ('cup', 'c', 1, 'volume', 0.125),
    ('quart', 'qt', 1, 'volume', 0.03125),
    ('drop', NULL, 0, 'volume', NULL),
    ('gram', 'gm', 1, 'mass', 28.3495),
    ('milligram', 'mg', 1, 'mass', 28349.5),
    ('pound', 'lb', 1, 'mass', 0.0625),
    ('splash', NULL, 0, 'volume', NULL),
    ('part', NULL, 0, 'miscellaneous', NULL),
    ('half', NULL, 0, 'miscellaneous', NULL),
    ('leaf', NULL, 0, 'quantity', NULL),
    ('peel' ,NULL, 0, 'quantity', NULL),
    ('quarter', NULL, 0, 'miscellaneous', NULL),
    ('shaving', NULL, 0, 'quantity', NULL),
    ('slice', NULL, 0, 'quantity', NULL),
    ('third', NULL, 0, 'miscellaneous',NULL),
    ('twist', NULL, 0, 'quantity', NULL),
    ('wedge', NULL, 0, 'quantity', NULL),
    ('cube', NULL, 0, 'quantity', NULL),
    ('pinch', NULL, 0, 'quantity', NULL),
    ('scoop', NULL, 0, 'quantity', NULL),
    ('sprig', NULL, 0, 'quantity', NULL),
    ('stalk', NULL, 0, 'quantity', NULL)
;